// frontend/src/components/ui/Alert.tsx
'use client';

import { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';

export interface AlertProps {
  /** The alert title */
  title?: string;
  /** The alert message */
  message: string;
  /** The alert type/variant */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Whether the alert is dismissible */
  dismissible?: boolean;
  /** Called when the alert is dismissed */
  onDismiss?: () => void;
  /** Whether the alert should auto-dismiss after a specified time */
  autoDismiss?: boolean;
  /** Time in ms before auto-dismissing */
  autoDismissTime?: number;
  /** Additional action to show in the alert */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional class name */
  className?: string;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Custom icon to override the default */
  icon?: React.ReactNode;
}

/**
 * Alert component for showing status messages, notifications, or feedback
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      title,
      message,
      type = 'info',
      dismissible = false,
      onDismiss,
      autoDismiss = false,
      autoDismissTime = 5000,
      action,
      className,
      showIcon = true,
      icon,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(true);

    // Auto-dismiss logic
    useEffect(() => {
      if (autoDismiss && visible) {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoDismissTime);

        return () => clearTimeout(timer);
      }
    }, [autoDismiss, autoDismissTime, onDismiss, visible]);

    // Dismiss handler
    const handleDismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    // Type-specific styles and icons
    const alertStyles = {
      success: {
        containerClass:
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        titleClass: 'text-green-800 dark:text-green-400',
        messageClass: 'text-green-700 dark:text-green-300',
        iconClass: 'text-green-500 dark:text-green-400',
        icon: <CheckCircle size={20} />,
      },
      error: {
        containerClass:
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        titleClass: 'text-red-800 dark:text-red-400',
        messageClass: 'text-red-700 dark:text-red-300',
        iconClass: 'text-red-500 dark:text-red-400',
        icon: <AlertCircle size={20} />,
      },
      warning: {
        containerClass:
          'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        titleClass: 'text-amber-800 dark:text-amber-400',
        messageClass: 'text-amber-700 dark:text-amber-300',
        iconClass: 'text-amber-500 dark:text-amber-400',
        icon: <AlertTriangle size={20} />,
      },
      info: {
        containerClass:
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        titleClass: 'text-blue-800 dark:text-blue-400',
        messageClass: 'text-blue-700 dark:text-blue-300',
        iconClass: 'text-blue-500 dark:text-blue-400',
        icon: <Info size={20} />,
      },
    };

    const styles = alertStyles[type];
    const alertIcon = icon || styles.icon;

    // Animation variants
    const variants = {
      hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
      visible: { opacity: 1, height: 'auto', marginTop: 8, marginBottom: 8 },
      exit: {
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        transition: { duration: 0.2 },
      },
    };

    if (!visible) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          className={cn(
            'border rounded-lg p-4 relative overflow-hidden',
            styles.containerClass,
            className,
          )}
          role="alert"
          {...props}
        >
          <div className="flex">
            {showIcon && (
              <div className={cn('flex-shrink-0 mr-3', styles.iconClass)}>
                {alertIcon}
              </div>
            )}

            <div className="flex-1">
              {title && (
                <h3
                  className={cn('text-sm font-medium mb-1', styles.titleClass)}
                >
                  {title}
                </h3>
              )}

              <div className={cn('text-sm', styles.messageClass)}>
                {message}
              </div>

              {action && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                      'inline-flex items-center text-sm font-medium hover:underline',
                      styles.titleClass,
                    )}
                  >
                    {action.label}
                    <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              )}
            </div>

            {dismissible && (
              <button
                type="button"
                className={cn(
                  'p-1.5 rounded-md absolute top-2 right-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-1',
                  styles.iconClass,
                )}
                onClick={handleDismiss}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Progress bar for auto-dismiss */}
          {autoDismiss && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
              <motion.div
                className={cn(
                  'h-full',
                  styles.iconClass.replace('text-', 'bg-'),
                )}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: autoDismissTime / 1000,
                  ease: 'linear',
                }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  },
);

Alert.displayName = 'Alert';
