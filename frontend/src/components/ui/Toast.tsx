// frontend/src/components/ui/Toast.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  onClose: (id: string) => void;
  showClose?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast = ({
  id,
  message,
  type = 'info',
  title,
  duration = 3000,
  position = 'top-right',
  onClose,
  showClose = true,
  action,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Handle automatic close after duration
  useEffect(() => {
    if (duration === Infinity) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // Animate progress bar
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 10);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration]);

  // Handle animation complete (trigger actual removal)
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose(id);
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
        );
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'warning':
        return (
          <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        );
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
    }
  };

  // Get background color class based on type
  const getContainerClass = () => {
    return cn(
      'relative min-w-[320px] max-w-sm rounded-lg p-4 shadow-lg border',
      {
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700': true,
        'border-l-4': true,
        'border-l-green-500 dark:border-l-green-500': type === 'success',
        'border-l-red-500 dark:border-l-red-500': type === 'error',
        'border-l-amber-500 dark:border-l-amber-500': type === 'warning',
        'border-l-blue-500 dark:border-l-blue-500': type === 'info',
      },
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            y: position.includes('top') ? -20 : 20,
            scale: 0.95,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={handleAnimationComplete}
          className={getContainerClass()}
          role="alert"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">{getIcon()}</div>

            <div className="ml-3 flex-1">
              {title && (
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              <div
                className={cn(
                  'text-sm text-gray-700 dark:text-gray-300',
                  title && 'mt-1',
                )}
              >
                {message}
              </div>

              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {action.label}
                </button>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {duration !== Infinity && (
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div
                className={cn('h-full transition-all', {
                  'bg-green-500': type === 'success',
                  'bg-red-500': type === 'error',
                  'bg-amber-500': type === 'warning',
                  'bg-blue-500': type === 'info',
                })}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast container
interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  children: React.ReactNode;
}

export const ToastContainer = ({
  position = 'top-right',
  children,
}: ToastContainerProps) => {
  const getContainerPosition = () => {
    switch (position) {
      case 'top-right':
        return 'top-0 right-0';
      case 'top-left':
        return 'top-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'top-center':
        return 'top-0 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-0 left-1/2 -translate-x-1/2';
      default:
        return 'top-0 right-0';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 m-4 flex flex-col gap-2',
        getContainerPosition(),
      )}
    >
      {children}
    </div>
  );
};
