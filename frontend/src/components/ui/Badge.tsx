// frontend/src/components/ui/Badge.tsx
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { motion, MotionProps } from 'framer-motion';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text content of the badge */
  text: string | number;
  /** Variant/color of the badge */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'default'
    | 'outline';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the badge is rounded */
  rounded?: boolean | 'full';
  /** Icon displayed before the text */
  icon?: React.ReactNode;
  /** Icon displayed after the text */
  rightIcon?: React.ReactNode;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Whether to show a close button */
  closable?: boolean;
  /** Called when the close button is clicked */
  onClose?: (e: React.MouseEvent) => void;
  /** Whether the badge pulses */
  pulse?: boolean;
  /** Whether the badge is outlined */
  outlined?: boolean;
  /** Custom color (will override variant) */
  color?: string;
  /** Enable hover animation */
  animated?: boolean;
  /** Animation properties */
  motionProps?: MotionProps;
}

/**
 * A versatile badge component for indicating status, counts, or labels
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      text,
      variant = 'default',
      size = 'md',
      rounded = 'full',
      icon,
      rightIcon,
      dot = false,
      closable = false,
      onClose,
      pulse = false,
      outlined = false,
      color,
      className,
      animated = false,
      motionProps,
      ...props
    },
    ref,
  ) => {
    // Determine variant-based styles
    const variantStyles = {
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      secondary:
        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warning:
        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      outline:
        'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    // Determine outline styles
    const outlinedStyles = {
      primary:
        'bg-transparent border border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-400',
      secondary:
        'bg-transparent border border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-400',
      success:
        'bg-transparent border border-green-500 text-green-700 dark:border-green-400 dark:text-green-400',
      danger:
        'bg-transparent border border-red-500 text-red-700 dark:border-red-400 dark:text-red-400',
      warning:
        'bg-transparent border border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-400',
      info: 'bg-transparent border border-cyan-500 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400',
      default:
        'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-500 dark:text-gray-400',
      outline:
        'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-500 dark:text-gray-400',
    };

    // Determine dot colors
    const dotColors = {
      primary: 'bg-blue-500 dark:bg-blue-400',
      secondary: 'bg-gray-500 dark:bg-gray-400',
      success: 'bg-green-500 dark:bg-green-400',
      danger: 'bg-red-500 dark:bg-red-400',
      warning: 'bg-amber-500 dark:bg-amber-400',
      info: 'bg-cyan-500 dark:bg-cyan-400',
      default: 'bg-gray-500 dark:bg-gray-400',
      outline: 'bg-gray-500 dark:bg-gray-400',
    };

    // Determine size styles
    const sizeStyles = {
      sm: 'text-xs px-2 py-0.5 h-5',
      md: 'text-xs px-2.5 py-0.5 h-6',
      lg: 'text-sm px-3 py-1 h-7',
    };

    // Determine pulse animation
    const pulseAnimation = pulse ? 'animate-pulse' : '';

    // Helper for rounded corners
    const getRoundedStyle = () => {
      if (rounded === 'full') return 'rounded-full';
      if (rounded === true) return 'rounded';
      return '';
    };

    // Generate class names
    const badgeClasses = cn(
      'inline-flex items-center font-medium',
      sizeStyles[size],
      getRoundedStyle(),
      outlined ? outlinedStyles[variant] : variantStyles[variant],
      pulseAnimation,
      className,
    );

    // Custom color style (if provided)
    const customColorStyle = color
      ? {
          backgroundColor: outlined ? 'transparent' : color,
          color: outlined ? color : 'white',
          borderColor: color,
          borderWidth: outlined ? '1px' : undefined,
        }
      : {};

    // Handle close button click
    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.(e);
    };

    // Determine component based on animation prop
    const Component = animated ? motion.span : 'span';

    // Combine props for animated badges
    const combinedProps = {
      ref,
      className: badgeClasses,
      style: customColorStyle,
      ...(animated ? motionProps : {}),
      ...props,
    };

    return (
      <Component {...combinedProps}>
        {dot && (
          <span
            className={cn('w-2 h-2 mr-1.5 rounded-full', dotColors[variant])}
          />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        <span>{text}</span>
        {rightIcon && <span className="ml-1">{rightIcon}</span>}
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-current hover:bg-opacity-25 hover:bg-black focus:outline-none"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </Component>
    );
  },
);

Badge.displayName = 'Badge';
