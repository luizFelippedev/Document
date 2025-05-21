// frontend/src/components/ui/Skeleton.tsx
'use client';

import { cn } from '@/utils/cn';

interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Whether the skeleton is rounded */
  rounded?: boolean;
  /** Whether the skeleton is circular */
  circle?: boolean;
  /** Whether the skeleton has a pulse animation */
  animate?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Skeleton component for loading states
 */
export const Skeleton = ({
  width,
  height,
  rounded = true,
  circle = false,
  animate = true,
  className,
  style,
  ...props
}: SkeletonProps) => {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        rounded && !circle && 'rounded',
        circle && 'rounded-full',
        animate && 'animate-pulse',
        className,
      )}
      style={{
        width,
        height,
        ...(circle && width ? { height: width } : {}),
        ...style,
      }}
      {...props}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton for text content with multiple lines
 */
export const SkeletonText = ({
  lines = 3,
  lastLineWidth = '67%',
  animate = true,
  spacing = 'normal',
  className,
}: {
  lines?: number;
  lastLineWidth?: string | number;
  animate?: boolean;
  spacing?: 'tight' | 'normal' | 'relaxed';
  className?: string;
}) => {
  const getSpacing = () => {
    switch (spacing) {
      case 'tight':
        return 'space-y-1';
      case 'relaxed':
        return 'space-y-3';
      default:
        return 'space-y-2';
    }
  };

  return (
    <div className={cn(getSpacing(), className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 && lastLineWidth ? lastLineWidth : '100%'}
          rounded
          animate={animate}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for an avatar or profile picture
 */
export const SkeletonAvatar = ({
  size = 'md',
  animate = true,
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}) => {
  const sizeMap = {
    sm: '2rem',
    md: '3rem',
    lg: '4rem',
    xl: '6rem',
  };

  return (
    <Skeleton
      width={sizeMap[size]}
      circle
      animate={animate}
      className={className}
    />
  );
};

/**
 * Skeleton for a button
 */
export const SkeletonButton = ({
  width = '6rem',
  height = '2.5rem',
  animate = true,
  className,
}: {
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  className?: string;
}) => {
  return (
    <Skeleton
      width={width}
      height={height}
      rounded
      animate={animate}
      className={className}
    />
  );
};

/**
 * Skeleton for a card
 */
export const SkeletonCard = ({
  header = true,
  lines = 3,
  footer = false,
  animate = true,
  className,
}: {
  header?: boolean;
  lines?: number;
  footer?: boolean;
  animate?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
        className,
      )}
    >
      {header && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton height={24} width="40%" animate={animate} />
        </div>
      )}
      <div className="p-4">
        <SkeletonText lines={lines} animate={animate} />
      </div>
      {footer && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <SkeletonButton width="5rem" height="2rem" animate={animate} />
          </div>
        </div>
      )}
    </div>
  );
};
