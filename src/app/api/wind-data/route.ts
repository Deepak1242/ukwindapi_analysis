import { NextRequest, NextResponse } from 'next/server';

// Types for Elexon API data
interface FUELHHRecord {
  dataset: string;
  publishTime: string;
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  fuelType: string;
  generation: number;
}

interface WINDFORRecord {
  dataset: string;
  publishTime: string;
  startTime: string;
  generation: number;
}

interface ProcessedDataPoint {
  time: string;
  actual: number | null;
  forecast: number | null;
}

// Configuration for forecast horizon (in hours)
const DEFAULT_FORECAST_HORIZON_HOURS = 4;

// Helper function to format date to match Elexon API format (without milliseconds)
function formatElexonTime(date: Date): string {
  return date.toISOString().replace('.000Z', 'Z');
}

// Fetch actual wind generation from FUELHH
async function fetchActualGeneration(startDate: string, endDate: string): Promise<FUELHHRecord[]> {
  const url = `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=${startDate}&settlementDateTo=${endDate}&fuelType=WIND`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FUELHH API error: ${response.status}`);
  }
  
  return response.json();
}

// Fetch wind forecasts from WINDFOR
async function fetchForecasts(startDate: string, endDate: string): Promise<WINDFORRecord[]> {
  // We need to fetch forecasts published from earlier to cover the forecast horizon requirement
  // Also need to fetch forecasts that target dates within our range
  const publishFrom = new Date(startDate);
  publishFrom.setDate(publishFrom.getDate() - 2); // Fetch from 2 days earlier to have enough forecast data
  
  const publishFromStr = publishFrom.toISOString().split('T')[0];
  
  const url = `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom=${publishFromStr}T00%3A00%3A00Z&publishDateTimeTo=${endDate}T23%3A59%3A59Z`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WINDFOR API error: ${response.status}`);
  }
  
  return response.json();
}

// Process and combine actual and forecast data
function processData(
  actualData: FUELHHRecord[],
  forecastData: WINDFORRecord[],
  startDate: string,
  endDate: string,
  forecastHorizonHours: number
): ProcessedDataPoint[] {
  // Create a map for actual generation by startTime
  // Keep only the latest publishTime for each startTime
  const actualMap = new Map<string, { generation: number; publishTime: string }>();
  
  actualData.forEach(record => {
    const time = record.startTime;
    const existing = actualMap.get(time);
    if (!existing || new Date(record.publishTime) > new Date(existing.publishTime)) {
      actualMap.set(time, { generation: record.generation, publishTime: record.publishTime });
    }
  });

  // Group forecasts by startTime (target time)
  const forecastByTargetTime = new Map<string, WINDFORRecord[]>();
  
  forecastData.forEach(record => {
    const targetTime = record.startTime;
    if (!forecastByTargetTime.has(targetTime)) {
      forecastByTargetTime.set(targetTime, []);
    }
    forecastByTargetTime.get(targetTime)!.push(record);
  });

  // Generate time series for the requested period
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 0, 0, 0);
  
  const result: ProcessedDataPoint[] = [];
  
  // Use hourly intervals to match forecast resolution
  for (let t = new Date(start); t <= end; t.setUTCHours(t.getUTCHours() + 1)) {
    const timeStr = t.toISOString();
    
    // Get actual generation (hourly - average of two 30-min periods)
    const hourStart = new Date(t);
    const hourStartStr = formatElexonTime(hourStart);
    
    // Actual generation is in 30-min intervals, so we need to aggregate
    const halfHourStr1 = hourStartStr;
    const halfHourDate = new Date(hourStart);
    halfHourDate.setUTCMinutes(30);
    const halfHourStr2 = formatElexonTime(halfHourDate);
    
    let actualValue: number | null = null;
    const val1 = actualMap.get(halfHourStr1);
    const val2 = actualMap.get(halfHourStr2);
    
    if (val1 && val2) {
      actualValue = (val1.generation + val2.generation) / 2;
    } else if (val1) {
      actualValue = val1.generation;
    } else if (val2) {
      actualValue = val2.generation;
    }

    // Get the latest forecast that was published at least forecastHorizonHours before target time
    const targetDate = new Date(t);
    const minPublishTime = new Date(targetDate.getTime() - forecastHorizonHours * 60 * 60 * 1000);
    
    const forecasts = forecastByTargetTime.get(hourStartStr) || [];
    
    // Filter forecasts that were published before the minimum required time
    const validForecasts = forecasts.filter(f => new Date(f.publishTime) <= minPublishTime);
    
    // Get the latest valid forecast
    let forecastValue: number | null = null;
    if (validForecasts.length > 0) {
      // Sort by publishTime descending to get the latest
      validForecasts.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
      forecastValue = validForecasts[0].generation;
    }

    // Check forecast horizon constraint (0-48 hours)
    if (forecastValue !== null) {
      const validForecast = validForecasts[0];
      const horizonHours = (targetDate.getTime() - new Date(validForecast.publishTime).getTime()) / (1000 * 60 * 60);
      if (horizonHours > 48) {
        forecastValue = null;
      }
    }

    result.push({
      time: timeStr,
      actual: actualValue,
      forecast: forecastValue,
    });
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get date range parameters - default to January 2024
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate') || '2024-01-07';
    const forecastHorizon = parseInt(searchParams.get('forecastHorizon') || `${DEFAULT_FORECAST_HORIZON_HOURS}`);
    
    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }
    
    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }
    
    // Limit date range to prevent excessive API calls (max 31 days)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 31 days' },
        { status: 400 }
      );
    }

    // Fetch data from Elexon APIs
    const [actualData, forecastData] = await Promise.all([
      fetchActualGeneration(startDate, endDate),
      fetchForecasts(startDate, endDate),
    ]);

    // Process and combine the data
    const processedData = processData(
      actualData,
      forecastData,
      startDate,
      endDate,
      forecastHorizon
    );

    // Calculate statistics
    const validDataPoints = processedData.filter(d => d.actual !== null && d.forecast !== null);
    
    let mae = 0;
    let mape = 0;
    let rmse = 0;
    
    if (validDataPoints.length > 0) {
      const errors = validDataPoints.map(d => Math.abs(d.actual! - d.forecast!));
      const percentErrors = validDataPoints.map(d => Math.abs(d.actual! - d.forecast!) / d.actual! * 100);
      const squaredErrors = validDataPoints.map(d => Math.pow(d.actual! - d.forecast!, 2));
      
      mae = errors.reduce((a, b) => a + b, 0) / errors.length;
      mape = percentErrors.reduce((a, b) => a + b, 0) / percentErrors.length;
      rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);
    }

    return NextResponse.json({
      data: processedData,
      statistics: {
        mae: Math.round(mae),
        mape: mape.toFixed(2),
        rmse: Math.round(rmse),
        totalDataPoints: processedData.length,
        validDataPoints: validDataPoints.length,
        actualDataPoints: processedData.filter(d => d.actual !== null).length,
        forecastDataPoints: processedData.filter(d => d.forecast !== null).length,
      },
      parameters: {
        startDate,
        endDate,
        forecastHorizon,
      },
    });
    
  } catch (error) {
    console.error('Error fetching wind data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wind generation data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
