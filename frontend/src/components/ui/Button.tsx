// frontend/src/components/ui/Button.tsx
'use client';

import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
        outline: 'border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
        link: 'bg-transparent text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 focus:ring-0 underline-offset-4 hover:underline',
      },
      size: {
        xs: 'text-xs px-2 py-1 rounded',
        sm: 'text-sm px-3 py-1.5 rounded',
        md: 'text-sm px-4 py-2 rounded-md',
        lg: 'text-base px-5 py-2.5 rounded-md',
        xl: 'text-lg px-6 py-3 rounded-lg',
        icon: 'p-2 rounded-full',
      },
      fullWidth: {
        true: 'w-full',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      rounded,
      disabled,
      loading,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Spinner 
                size={size === 'xs' || size === 'sm' ? 'small' : 'medium'} 
                variant={variant === 'outline' || variant === 'ghost' || variant === 'link' ? 'primary' : 'white'} 
              />
            </span>
            <span className="opacity-0">
              {loadingText || children}
            </span>
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';