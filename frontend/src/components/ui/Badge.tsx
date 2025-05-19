// frontend/src/components/ui/Badge.tsx
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        secondary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        outline: 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  text?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  color?: string;
}

export const Badge = ({
  className,
  variant,
  size,
  text,
  dismissible = false,
  onDismiss,
  icon,
  color,
  children,
  ...props
}: BadgeProps) => {
  // Allow custom colors
  const customStyles = color ? {
    backgroundColor: `${color}20`, // 20% opacity
    color: color,
    borderColor: color,
  } : {};
  
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      style={variant === 'outline' && color ? { ...customStyles, backgroundColor: 'transparent' } : customStyles}
      {...props}
    >
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {text || children}
      {dismissible && onDismiss && (
        <button 
          type="button"
          className="ml-1 -mr-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 p-0.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

// Specialty Badge for Skills
export const SkillBadge = ({ 
  name, 
  level = 0, 
  size = 'md',
  onClick,
  className,
  ...props
}: { 
  name: string; 
  level?: number; 
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}) => {
  const getColorByLevel = () => {
    if (level < 30) return 'bg-gray-100 dark:bg-gray-700';
    if (level < 50) return 'bg-blue-100 dark:bg-blue-900';
    if (level < 70) return 'bg-green-100 dark:bg-green-900';
    if (level < 90) return 'bg-purple-100 dark:bg-purple-900';
    return 'bg-amber-100 dark:bg-amber-900';
  };
  
  const getTextColorByLevel = () => {
    if (level < 30) return 'text-gray-700 dark:text-gray-300';
    if (level < 50) return 'text-blue-700 dark:text-blue-300';
    if (level < 70) return 'text-green-700 dark:text-green-300';
    if (level < 90) return 'text-purple-700 dark:text-purple-300';
    return 'text-amber-700 dark:text-amber-300';
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 h-5',
    md: 'text-xs px-2.5 py-0.5 h-6',
    lg: 'text-sm px-3 py-1 h-7',
  };
  
  return (
    <div 
      className={cn(
        'relative inline-flex items-center rounded-full overflow-hidden cursor-pointer',
        sizeClasses[size],
        getColorByLevel(),
        getTextColorByLevel(),
        onClick ? 'cursor-pointer hover:ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-700' : '',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="z-10 px-2">{name}</span>
      
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 bg-opacity-40 dark:bg-opacity-60 bg-gradient-to-r from-current to-transparent" 
          style={{ width: `${level}%` }}
        ></div>
      )}
    </div>
  );
};