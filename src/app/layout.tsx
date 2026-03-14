import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UK Wind Power Forecast Accuracy | Elexon Data Analysis",
  description: "Interactive dashboard displaying the accuracy of UK national-level wind power generation forecasts. Compare actual vs forecasted generation using Elexon BMRS data for January 2024.",
  keywords: ["wind power", "forecast", "UK", "Elexon", "BMRS", "renewable energy", "data visualization", "generation forecast"],
  authors: [{ name: "Wind Power Analytics" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "UK Wind Power Forecast Accuracy",
    description: "Compare actual vs forecasted wind power generation in the UK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Wind Power Forecast Accuracy",
    description: "Compare actual vs forecasted wind power generation in the UK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
