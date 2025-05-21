// frontend/src/components/ui/Card.tsx
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { motion, MotionProps } from 'framer-motion';
import { Skeleton } from './Skeleton';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title displayed in the header */
  title?: React.ReactNode;
  /** Whether the card has a shadow */
  shadow?: boolean;
  /** Whether the card has a border */
  bordered?: boolean;
  /** Whether the card has padding */
  padded?: boolean;
  /** Whether the card is loading */
  isLoading?: boolean;
  /** The header right content */
  headerRight?: React.ReactNode;
  /** The footer content */
  footer?: React.ReactNode;
  /** Additional card content class name */
  contentClassName?: string;
  /** Enable hover animation */
  hoverEffect?: boolean;
  /** Enable click animation */
  clickEffect?: boolean;
  /** Make card hoverable (adds hover styling) */
  hoverable?: boolean;
  /** Additional animation props from framer-motion */
  motionProps?: MotionProps;
}

const CardComponent = forwardRef<HTMLDivElement, CardProps>(
  ({
    title,
    shadow = true,
    bordered = true,
    padded = true,
    isLoading = false,
    headerRight,
    footer,
    children,
    className,
    contentClassName,
    hoverEffect = false,
    clickEffect = false,
    hoverable = false,
    motionProps,
    ...props
  }, ref) => {
    const cardClasses = cn(
      'rounded-lg overflow-hidden',
      shadow && 'shadow-sm',
      bordered && 'border border-gray-200 dark:border-gray-700',
      hoverable && 'transition-shadow hover:shadow-md',
      'bg-white dark:bg-gray-800',
      className
    );
    
    const contentClasses = cn(
      padded && !title && !footer && 'p-6',
      contentClassName
    );
    
    const Component = (hoverEffect || clickEffect) ? motion.div : 'div';
    
    const motionSettings = {
      ...(hoverEffect && {
        whileHover: { y: -5, transition: { duration: 0.2 } },
      }),
      ...(clickEffect && {
        whileTap: { scale: 0.98 },
      }),
      ...motionProps,
    };
    
    const renderContent = () => {
      if (isLoading) {
        return (
          <>
            {title && (
              <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <Skeleton className="h-6 w-1/3" />
                {headerRight && <Skeleton className="h-6 w-24" />}
              </div>
            )}
            <div className={contentClasses}>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            {footer && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <Skeleton className="h-8 w-1/3" />
              </div>
            )}
          </>
        );
      }
      
      return (
        <>
          {title && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              {typeof title === 'string' ? (
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
              ) : (
                title
              )}
              {headerRight && (
                <div className="flex items-center">{headerRight}</div>
              )}
            </div>
          )}
          <div className={contentClasses}>{children}</div>
          {footer && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              {footer}
            </div>
          )}
        </>
      );
    };
    
    return (
      <Component
        ref={ref}
        className={cardClasses}
        {...(hoverEffect || clickEffect ? motionSettings : {})}
        {...props}
      >
        {renderContent()}
      </Component>
    );
  }
);

CardComponent.displayName = 'Card';

export const Card = CardComponent;