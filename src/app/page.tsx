'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  Calendar, 
  Clock, 
  RefreshCw,
  AlertCircle,
  BarChart3
} from 'lucide-react';

// Types
interface DataPoint {
  time: string;
  actual: number | null;
  forecast: number | null;
  timeLabel?: string;
}

interface Statistics {
  mae: number;
  mape: string;
  rmse: number;
  totalDataPoints: number;
  validDataPoints: number;
  actualDataPoints: number;
  forecastDataPoints: number;
}

interface ApiResponse {
  data: DataPoint[];
  statistics: Statistics;
  parameters: {
    startDate: string;
    endDate: string;
    forecastHorizon: number;
  };
}

// Date presets - various time periods
const DATE_PRESETS = [
  { label: 'Jan 2024 Week 1', start: '2024-01-01', end: '2024-01-07' },
  { label: 'Jan 2024 Week 2', start: '2024-01-08', end: '2024-01-14' },
  { label: 'Jan 2024 Week 3', start: '2024-01-15', end: '2024-01-21' },
  { label: 'Jan 2024 Week 4', start: '2024-01-22', end: '2024-01-28' },
  { label: 'Jan 2024 Full', start: '2024-01-01', end: '2024-01-31' },
];

// Chart configuration
const chartConfig: ChartConfig = {
  actual: {
    label: 'Actual Generation',
    color: '#3b82f6', // Blue
  },
  forecast: {
    label: 'Forecast Generation',
    color: '#22c55e', // Green
  },
};

export default function Home() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter parameters
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-07');
  const [forecastHorizon, setForecastHorizon] = useState(4);
  
  // View settings
  const [selectedPreset, setSelectedPreset] = useState(0);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        forecastHorizon: forecastHorizon.toString(),
      });
      
      const response = await fetch(`/api/wind-data?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      
      const result: ApiResponse = await response.json();
      
      // Format data for chart - format time labels
      const formattedData = result.data.map(d => ({
        ...d,
        timeLabel: new Date(d.time).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      
      setData(formattedData);
      setStatistics(result.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, forecastHorizon]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle preset selection
  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setStartDate(DATE_PRESETS[index].start);
    setEndDate(DATE_PRESETS[index].end);
  };

  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString();

// Enforce global max date to Jan 31, 2024 per challenge requirements
  const janMax = '2024-01-31';

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 selection:bg-blue-200 dark:selection:bg-blue-900">
      {/* Decorative gradient background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-100/60 via-slate-50/50 to-transparent dark:from-blue-900/20 dark:via-slate-950/50 pointer-events-none" />
      
      <div className="relative flex flex-col min-h-screen">
        {/* Header - Glassmorphism */}
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  UK Wind Power Forecast Accuracy
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Elexon BMRS Data Analysis
                </p>
              </div>
            </div>
            <Button 
              onClick={fetchData} 
              disabled={loading}
              className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls - Premium Card */}
        <Card className="mb-8 border-slate-200/60 dark:border-slate-800/60 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all hover:shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Range & Settings
            </CardTitle>
            <CardDescription>
              Select a date range (max 31 days) and configure the forecast horizon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Date Presets */}
              <div className="space-y-3">
                <Label>Quick Select</Label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset, index) => (
                    <Button
                      key={index}
                      variant={selectedPreset === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetSelect(index)}
                      className={`rounded-full transition-all ${selectedPreset === index ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Custom Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setSelectedPreset(-1);
                      }}
                      max={janMax}
                      min="2024-01-01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setSelectedPreset(-1);
                      }}
                      max={janMax}
                      min="2024-01-01"
                    />
                  </div>
                </div>

                {/* Forecast Horizon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="horizon">Forecast Horizon</Label>
                    <Badge variant="secondary">{forecastHorizon} hours</Badge>
                  </div>
                  <Slider
                    id="horizon"
                    min={0}
                    max={48}
                    step={1}
                    value={[forecastHorizon]}
                    onValueChange={(value) => setForecastHorizon(value[0])}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Minimum time between forecast creation and target time
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-blue-900/10 pointer-events-none" />
              <CardContent className="pt-5 pb-5 relative z-10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Mean Absolute Error</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatNumber(statistics.mae)} <span className="text-lg text-slate-400 font-normal">MW</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-emerald-900/10 pointer-events-none" />
              <CardContent className="pt-5 pb-5 relative z-10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">MAPE</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {statistics.mape}<span className="text-slate-400">%</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-amber-900/10 pointer-events-none" />
              <CardContent className="pt-5 pb-5 relative z-10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">RMSE</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatNumber(statistics.rmse)} <span className="text-lg text-slate-400 font-normal">MW</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-purple-900/10 pointer-events-none" />
              <CardContent className="pt-5 pb-5 relative z-10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Data Points</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {statistics.validDataPoints}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Generation Comparison
            </CardTitle>
            <CardDescription>
              Actual (blue) vs Forecast (green dashed) wind power generation in MW
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : data.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[400px] sm:h-[500px] w-full">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    label={{
                      value: 'MW',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#64748b' },
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${Number(value).toLocaleString()} MW`]}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    strokeDasharray="5 5"
                    name="forecast"
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-slate-500">
                No data available for the selected date range
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Info */}
        {statistics && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {statistics.actualDataPoints} actual data points and {statistics.forecastDataPoints} forecast points
              with a {forecastHorizon}-hour minimum forecast horizon
            </p>
            <p className="mt-1">
              Date range: {startDate} to {endDate}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm text-slate-500 dark:text-slate-400 shadow-sm transition-all hover:shadow hover:bg-white dark:hover:bg-slate-900">
            <span>Data Source:</span>
            <a 
              href="https://www.elexon.co.uk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Elexon BMRS
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
