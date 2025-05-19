// frontend/src/components/ui/Alert.tsx
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { AlertCircle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

const alertVariants = cva(
  'relative w-full p-4 text-sm border rounded-lg flex items-start',
  {
    variants: {
      variant: {
        info: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        success: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        warning: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        error: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  message: string;
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert = ({
  className,
  message,
  title,
  type = 'info',
  variant = type as any,
  icon,
  dismissible = false,
  onDismiss,
  ...props
}: AlertProps) => {
  const IconComponent = iconMap[type];
  
  const getIconColor = () => {
    switch (type) {
      case 'info':
        return 'text-blue-500 dark:text-blue-400';
      case 'success':
        return 'text-green-500 dark:text-green-400';
      case 'warning':
        return 'text-amber-500 dark:text-amber-400';
      case 'error':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-blue-500 dark:text-blue-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(alertVariants({ variant }), className)}
      role="alert"
      {...props}
    >
      {icon || (
        <IconComponent className={cn('h-5 w-5 mr-3 mt-0.5', getIconColor())} />
      )}
      
      <div className="flex-1">
        {title && (
          <h4 className="text-base font-medium mb-1">{title}</h4>
        )}
        <div className="text-sm">{message}</div>
      </div>
      
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
        >
          <span className="sr-only">Close</span>
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};