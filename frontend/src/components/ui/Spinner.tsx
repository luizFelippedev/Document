// frontend/src/components/ui/Spinner.tsx
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-t-transparent',
  {
    variants: {
      size: {
        small: 'h-4 w-4 border-2',
        medium: 'h-6 w-6 border-2',
        large: 'h-10 w-10 border-3',
        xl: 'h-16 w-16 border-4',
      },
      variant: {
        primary: 'border-blue-600 dark:border-blue-500',
        secondary: 'border-green-600 dark:border-green-500',
        white: 'border-white',
        gray: 'border-gray-600 dark:border-gray-400',
      },
    },
    defaultVariants: {
      size: 'medium',
      variant: 'primary',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export const Spinner = ({ className, size, variant, label, ...props }: SpinnerProps) => {
  return (
    <div className="inline-flex items-center" role="status" {...props}>
      <div
        className={cn(spinnerVariants({ size, variant, className }))}
        aria-hidden="true"
      />
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};