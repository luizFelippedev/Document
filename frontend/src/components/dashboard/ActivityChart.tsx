// frontend/src/components/dashboard/ActivityChart.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
} from "lucide-react";

interface ActivityData {
  date: string;
  count: number;
  [key: string]: any;
}

interface ActivityChartProps {
  data: ActivityData[];
  title?: string;
  showControls?: boolean;
  height?: number;
  className?: string;
  loading?: boolean;
}

export const ActivityChart = ({
  data,
  title = "Activity Overview",
  showControls = true,
  height = 350,
  className,
  loading = false,
}: ActivityChartProps) => {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [currentData, setCurrentData] = useState<ActivityData[]>([]);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const { resolvedTheme } = useTheme();

  // Filter data based on time range
  useEffect(() => {
    if (!data || data.length === 0) {
      setCurrentData([]);
      return;
    }

    const now = new Date();
    let filtered = [...data];

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);

      if (!isValid(dateA) || !isValid(dateB)) {
        return 0;
      }

      return dateA.getTime() - dateB.getTime();
    });

    // Filter by time range
    if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);

      filtered = filtered.filter((item) => {
        const itemDate = parseISO(item.date);
        return isValid(itemDate) && itemDate >= cutoff;
      });
    }

    setCurrentData(filtered);
  }, [data, timeRange]);

  // Calculate trend
  const getTrend = () => {
    if (currentData.length < 2) return 0;

    const first = currentData[0].count;
    const last = currentData[currentData.length - 1].count;

    return ((last - first) / first) * 100;
  };

  const trend = getTrend();

  // Calculate average
  const getAverage = () => {
    if (currentData.length === 0) return 0;

    const sum = currentData.reduce((acc, item) => acc + item.count, 0);
    return sum / currentData.length;
  };

  const average = getAverage();

  // Handle CSV download
  const handleDownload = () => {
    // Create CSV content
    const headers = Object.keys(currentData[0] || {}).join(",");
    const rows = currentData
      .map((item) => Object.values(item).join(","))
      .join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = downloadRef.current;

    if (link) {
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `activity_data_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      link.click();
    }
  };

  // Format X-axis ticks
  const formatXAxis = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      if (!isValid(date)) return tickItem;

      // Format based on time range
      if (timeRange === "7d") {
        return format(date, "EEE");
      } else if (timeRange === "30d") {
        return format(date, "MMM d");
      } else {
        return format(date, "MMM yyyy");
      }
    } catch (error) {
      return tickItem;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      const formattedDate = isValid(date) ? format(date, "MMM d, yyyy") : label;

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {formattedDate}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Count:{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {payload[0].value}
            </span>
          </p>
        </div>
      );
    }

    return null;
  };

  // Theme-aware colors
  const getColors = () => {
    return {
      primary: resolvedTheme === "dark" ? "#60a5fa" : "#3b82f6",
      gridLines: resolvedTheme === "dark" ? "#374151" : "#e5e7eb",
      tooltip: resolvedTheme === "dark" ? "#1f2937" : "#ffffff",
      text: resolvedTheme === "dark" ? "#9ca3af" : "#6b7280",
    };
  };

  const colors = getColors();

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart
            data={currentData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLines} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <YAxis
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={colors.primary}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart
            data={currentData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLines} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <YAxis
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={colors.primary}
              strokeWidth={2}
              fill={`${colors.primary}20`}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart
            data={currentData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLines} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <YAxis
              tick={{ fill: colors.text, fontSize: 12 }}
              stroke={colors.gridLines}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      title={title}
      className={className}
      isLoading={loading}
      headerRight={
        showControls && (
          <div className="flex items-center space-x-2">
            {/* Chart type selector */}
            <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setChartType("line")}
                className={`p-1 rounded ${
                  chartType === "line"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                title="Line Chart"
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`p-1 rounded ${
                  chartType === "area"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                title="Area Chart"
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1 rounded ${
                  chartType === "bar"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                title="Bar Chart"
              >
                <BarChart2 size={16} />
              </button>
            </div>

            {/* Time range selector */}
            <Select
              value={timeRange}
              onChange={(val) => setTimeRange(val as any)}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
                { value: "all", label: "All time" },
              ]}
              variant="filled"
              size="sm"
              className="w-32 sm:w-40"
            />

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download CSV"
            >
              <Download size={16} />
            </button>

            {/* Hidden download link */}
            <a ref={downloadRef} className="hidden"></a>
          </div>
        )
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Average
            </span>
            <div className="text-xl font-semibold">{average.toFixed(1)}</div>
          </div>

          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trend
            </span>
            <div className="flex items-center">
              {trend > 0 ? (
                <>
                  <TrendingUp size={16} className="text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">
                    +{trend.toFixed(1)}%
                  </span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown size={16} className="text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {trend.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span className="text-gray-500 font-medium">0%</span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="sm:hidden">
          <button
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              // Toggle between chart types
              const types: ("line" | "area" | "bar")[] = [
                "line",
                "area",
                "bar",
              ];
              const currentIndex = types.indexOf(chartType);
              const nextIndex = (currentIndex + 1) % types.length;
              setChartType(types[nextIndex]);
            }}
          >
            {chartType === "line" ? (
              <TrendingUp size={16} />
            ) : chartType === "area" ? (
              <TrendingUp size={16} />
            ) : (
              <BarChart2 size={16} />
            )}
          </button>
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        {currentData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              No data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
