# UK Wind Power Forecast Dashboard

A web application that visualizes the accuracy of national-level wind power generation forecasts in the United Kingdom. Built as a submission for a Full Stack Software Engineering challenge.

## Live 
![Dashboard Preview](https://asss-six-iota.vercel.app/)

## Features

- **Real-time API Integration**: Fetches actual and forecasted wind generation data from Elexon BMRS in real-time.
- **Interactive Visualization**: Compares actual wind generation against forecasted generation over time.
- **Configurable Horizon**: A slider to analyze forecasts made anywhere between 0 to 48 hours ahead of the target time.
- **Accuracy Statistics**: Instantly calculates and displays MAE, MAPE, and RMSE metrics based on the selected date range.
- **Responsive Design**: Clean and usable on both desktop and mobile screens.

## Tech Stack

- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Charts**: Recharts

## Data Constraints & Logic

- **Date Range**: The application specifically restricts data to **January 2024** as per the challenge requirements.
- **Forecast Horizon**: The app retrieves the latest available forecast that was published at least `N` hours before the target time (configurable via the UI slider, up to 48 hours).
- **Missing Data**: Missing forecast data points are intentionally ignored and not plotted to prevent skewed visualizations.

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app/page.tsx`: Main dashboard UI and chart logic.
- `/src/app/api/wind-data/route.ts`: API route for fetching and aggregating Elexon BMRS data.
- `/notebooks/`: Jupyter notebooks containing the data analysis for forecast errors and wind power reliability.
# ukwindapi_analysis
