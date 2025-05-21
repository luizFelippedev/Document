// frontend/src/components/ui/Switch.tsx
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Whether the switch is checked */
  checked: boolean;
  /** Called when the switch is toggled */
  onChange: (checked: boolean) => void;
  /** The size of the switch */
  size?: 'sm' | 'md' | 'lg';
  /** The variant of the switch */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  /** The switch label */
  label?: string;
  /** The position of the label */
  labelPosition?: 'left' | 'right';
  /** Additional description text */
  description?: string;
  /** Additional class name */
  className?: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Whether the switch is required */
  required?: boolean;
  /** Whether the switch is loading */
  loading?: boolean;
}

/**
 * A switch component for toggling between two states
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({
    checked,
    onChange,
    size = 'md',
    variant = 'primary',
    label,
    labelPosition = 'right',
    description,
    className,
    disabled = false,
    required = false,
    loading = false,
    id,
    ...props
  }, ref) => {
    // Generate a unique ID if none is provided
    const uniqueId = id || `switch-${Math.random().toString(36).substring(2, 10)}`;
    
    // Size styles
    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            track: 'h-4 w-7',
            thumb: 'h-3 w-3',
            offset: 'translate-x-3',
            text: 'text-sm',
          };
        case 'lg':
          return {
            track: 'h-7 w-14',
            thumb: 'h-6 w-6',
            offset: 'translate-x-7',
            text: 'text-base',
          };
        default:
          return {
            track: 'h-6 w-11',
            thumb: 'h-5 w-5',
            offset: 'translate-x-5',
            text: 'text-base',
          };
      }
    };
    
    // Variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'secondary':
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-gray-600 dark:checked:bg-gray-500';
        case 'success':
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-green-600 dark:checked:bg-green-500';
        case 'danger':
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-red-600 dark:checked:bg-red-500';
        case 'warning':
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-amber-600 dark:checked:bg-amber-500';
        case 'info':
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-blue-600 dark:checked:bg-blue-500';
        default:
          return 'bg-gray-200 dark:bg-gray-700 checked:bg-blue-600 dark:checked:bg-blue-500';
      }
    };
    
    const sizeStyles = getSizeStyles();
    
    // Handle the change event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && !loading) {
        onChange(e.target.checked);
      }
    };
    
    // Switch track/background
    const trackClasses = cn(
      'relative inline-flex flex-shrink-0 rounded-full transition-colors ease-in-out duration-200',
      sizeStyles.track,
      getVariantStyles(),
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      loading ? 'animate-pulse' : '',
      className
    );
    
    // Switch thumb/handle
    const thumbClasses = cn(
      'absolute left-0.5 top-0.5 pointer-events-none inline-block rounded-full bg-white shadow transform transition ease-in-out duration-200',
      sizeStyles.thumb,
      loading ? 'animate-pulse' : ''
    );
    
    // Render label and switch in the correct order
    const renderSwitchWithLabel = () => {
      const switchElement = (
        <div className="relative inline-block align-middle">
          <input
            ref={ref}
            type="checkbox"
            id={uniqueId}
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            disabled={disabled || loading}
            required={required}
            aria-labelledby={label ? `${uniqueId}-label` : undefined}
            aria-describedby={description ? `${uniqueId}-description` : undefined}
            {...props}
          />
          <span
            aria-hidden="true"
            className={trackClasses}
          >
            <motion.span
              className={thumbClasses}
              animate={{
                translateX: checked ? sizeStyles.offset.split('-')[1] : '0rem',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </span>
        </div>
      );
      
      if (!label) return switchElement;
      
      const labelElement = (
        <div className="flex flex-col">
          <label
            id={`${uniqueId}-label`}
            htmlFor={uniqueId}
            className={cn(
              'font-medium text-gray-900 dark:text-white',
              sizeStyles.text,
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          
          {description && (
            <span
              id={`${uniqueId}-description`}
              className="mt-0.5 text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </span>
          )}
        </div>
      );
      
      return (
        <div className="flex items-start">
          {labelPosition === 'left' ? (
            <>
              <div className="mr-3">{labelElement}</div>
              {switchElement}
            </>
          ) : (
            <>
              {switchElement}
              <div className="ml-3">{labelElement}</div>
            </>
          )}
        </div>
      );
    };
    
    return renderSwitchWithLabel();
  }
);

Switch.displayName = 'Switch';