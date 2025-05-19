// frontend/src/components/ui/Input.tsx
'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const inputVariants = cva(
  'w-full transition-colors focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        filled: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800',
        unstyled: 'bg-transparent shadow-none border-none px-0 py-0',
      },
      inputSize: {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 rounded-md',
        lg: 'px-5 py-3 text-lg rounded-md',
      },
      state: {
        default: 'border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        error: 'border border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
        success: 'border border-green-500 dark:border-green-500 focus:border-green-500 dark:focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      state,
      type = 'text',
      error,
      leftElement,
      rightElement,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative", containerClassName)}>
        {leftElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {leftElement}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({
              variant,
              inputSize,
              state: error ? 'error' : state,
            }),
            leftElement && 'pl-10',
            rightElement && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {rightElement}
          </div>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';