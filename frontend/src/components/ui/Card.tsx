// frontend/src/components/ui/Card.tsx
'use client';

import React, { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

const cardVariants = cva(
  'rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        elevated: 'bg-white dark:bg-gray-800 shadow-lg',
        outline: 'bg-transparent border border-gray-200 dark:border-gray-700',
        ghost: 'bg-transparent',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
      },
      animate: {
        none: '',
        fadeIn: '',
        slideUp: '',
        scaleUp: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      animate: 'none',
    },
  }
);

const cardHeaderVariants = cva(
  'border-b border-gray-200 dark:border-gray-700',
  {
    variants: {
      padding: {
        none: '',
        sm: 'px-3 py-2',
        md: 'px-5 py-4',
        lg: 'px-6 py-5',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

const cardBodyVariants = cva(
  '',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

const cardFooterVariants = cva(
  'border-t border-gray-200 dark:border-gray-700',
  {
    variants: {
      padding: {
        none: '',
        sm: 'px-3 py-2',
        md: 'px-5 py-4',
        lg: 'px-6 py-5',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string;
  titleClassName?: string;
  subtitle?: string;
  headerClassName?: string;
  headerRight?: ReactNode;
  bodyClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
  isLoading?: boolean;
}

const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  },
};

export const Card = ({
  className,
  variant,
  padding,
  animate,
  title,
  titleClassName,
  subtitle,
  headerClassName,
  headerRight,
  children,
  bodyClassName,
  footer,
  footerClassName,
  isLoading,
  ...props
}: CardProps) => {
  const Component = animate !== 'none' ? motion.div : 'div';
  const motionProps = animate !== 'none'
    ? {
        initial: 'hidden',
        animate: 'visible',
        variants: animationVariants[animate as keyof typeof animationVariants],
      }
    : {};
  
  const hasHeader = title || subtitle || headerRight;
  
  return (
    <Component
      className={cn(cardVariants({ variant, padding: hasHeader || footer ? 'none' : padding }), className)}
      {...motionProps}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full px-5 py-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-3 mt-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {hasHeader && (
            <div className={cn(cardHeaderVariants({ padding }), headerClassName)}>
              <div className="flex justify-between items-center">
                <div>
                  {title && <h3 className={cn("font-medium text-gray-900 dark:text-white", titleClassName)}>{title}</h3>}
                  {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                {headerRight && <div>{headerRight}</div>}
              </div>
            </div>
          )}
          
          <div className={cn(cardBodyVariants({ padding }), bodyClassName)}>
            {children}
          </div>
          
          {footer && (
            <div className={cn(cardFooterVariants({ padding }), footerClassName)}>
              {footer}
            </div>
          )}
        </>
      )}
    </Component>
  );
};