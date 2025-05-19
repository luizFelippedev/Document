// frontend/src/components/ui/Switch.tsx
'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  id?: string;
}

export const Switch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  color = 'primary',
  className,
  labelClassName,
  switchClassName,
  id,
}: SwitchProps) => {
  // Size classes
  const sizeMap = {
    sm: {
      container: 'h-4 w-7',
      circle: 'h-3 w-3',
      translate: 'translate-x-3',
      labelText: 'text-sm',
      descriptionText: 'text-xs',
    },
    md: {
      container: 'h-5 w-9',
      circle: 'h-4 w-4',
      translate: 'translate-x-4',
      labelText: 'text-base',
      descriptionText: 'text-sm',
    },
    lg: {
      container: 'h-6 w-11',
      circle: 'h-5 w-5',
      translate: 'translate-x-5',
      labelText: 'text-lg',
      descriptionText: 'text-base',
    },
  };
  
  // Color classes
  const colorMap = {
    primary: {
      bg: 'bg-blue-600 dark:bg-blue-600',
      border: 'focus:ring-blue-500 dark:focus:ring-blue-500',
    },
    success: {
      bg: 'bg-green-600 dark:bg-green-600',
      border: 'focus:ring-green-500 dark:focus:ring-green-500',
    },
    danger: {
      bg: 'bg-red-600 dark:bg-red-600',
      border: 'focus:ring-red-500 dark:focus:ring-red-500',
    },
    warning: {
      bg: 'bg-yellow-600 dark:bg-yellow-600',
      border: 'focus:ring-yellow-500 dark:focus:ring-yellow-500',
    },
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          sizeMap[size].container,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          checked ? colorMap[color].bg : 'bg-gray-200 dark:bg-gray-700',
          colorMap[color].border,
          switchClassName
        )}
      >
        <span className="sr-only">{label || 'Toggle'}</span>
        <motion.span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0',
            sizeMap[size].circle
          )}
          animate={{
            x: checked ? parseInt(sizeMap[size].translate.split('-x-')[1]) : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </HeadlessSwitch>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "font-medium text-gray-700 dark:text-gray-300",
                sizeMap[size].labelText,
                disabled && "opacity-50",
                labelClassName
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              "text-gray-500 dark:text-gray-400",
              sizeMap[size].descriptionText,
              disabled && "opacity-50"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Toggle group component for multiple related switches
interface ToggleGroupProps {
  items: {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
  }[];
  onChange: (id: string, checked: boolean) => void;
  title?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}

export const ToggleGroup = ({
  items,
  onChange,
  title,
  disabled,
  size = 'md',
  color = 'primary',
  className,
}: ToggleGroupProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <Switch
            key={item.id}
            id={item.id}
            checked={item.checked}
            onChange={(checked) => onChange(item.id, checked)}
            label={item.label}
            description={item.description}
            disabled={disabled}
            size={size}
            color={color}
          />
        ))}
      </div>
    </div>
  );
};