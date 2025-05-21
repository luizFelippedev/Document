// frontend/src/components/dashboard/StatCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  change,
  trend,
  icon,
  bgColor = 'bg-white dark:bg-gray-800',
  textColor = 'text-gray-900 dark:text-white',
  className,
}: StatCardProps) => {
  // Trend color and icon
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
        bgColor,
        className,
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <h3 className={cn('mt-1 text-2xl font-semibold', textColor)}>
              {value}
            </h3>
          </div>

          {icon && (
            <div className="rounded-md bg-blue-100 dark:bg-blue-900 p-3 text-blue-600 dark:text-blue-400">
              {icon}
            </div>
          )}
        </div>

        {(change || trend) && (
          <div className="mt-4 flex items-center">
            {trend && (
              <div className={cn('flex items-center text-xs', getTrendColor())}>
                {getTrendIcon()}
                <span className="ml-1">{change}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Usage with a custom trend component
export const StatCardWithTrend = ({
  title,
  value,
  previousValue,
  icon,
  className,
}: {
  title: string;
  value: number;
  previousValue: number;
  icon?: React.ReactNode;
  className?: string;
}) => {
  const percentChange =
    previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;

  const trend =
    percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';

  return (
    <StatCard
      title={title}
      value={value.toLocaleString()}
      change={`${Math.abs(percentChange).toFixed(1)}%`}
      trend={trend}
      icon={icon || <Activity size={24} />}
      className={className}
    />
  );
};
