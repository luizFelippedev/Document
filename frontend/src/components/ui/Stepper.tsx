// frontend/src/components/ui/Stepper.tsx
'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Step {
  id: number | string;
  label: string;
  description?: string;
  optional?: boolean;
  icon?: React.ReactNode;
  errorMessage?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number | string;
  onChange: (step: number | string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  className?: string;
  stepClassName?: string;
  activeStepClassName?: string;
  completedStepClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  lineClassName?: string;
}

export const Stepper = ({
  steps,
  currentStep,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  readOnly = false,
  className,
  stepClassName,
  activeStepClassName,
  completedStepClassName,
  labelClassName,
  iconClassName,
  lineClassName,
}: StepperProps) => {
  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      circle: 'h-6 w-6',
      icon: 'h-3 w-3',
      line: orientation === 'horizontal' ? 'h-[1px]' : 'w-[1px]',
    },
    md: {
      container: 'text-sm',
      circle: 'h-8 w-8',
      icon: 'h-4 w-4',
      line: orientation === 'horizontal' ? 'h-[2px]' : 'w-[2px]',
    },
    lg: {
      container: 'text-base',
      circle: 'h-10 w-10',
      icon: 'h-5 w-5',
      line: orientation === 'horizontal' ? 'h-[2px]' : 'w-[2px]',
    },
  };
  
  // Variant classes
  const getCircleClasses = (isActive: boolean, isCompleted: boolean, hasError: boolean) => {
    const baseClasses = 'flex items-center justify-center rounded-full';
    
    if (variant === 'default') {
      if (hasError) {
        return cn(baseClasses, 'bg-red-100 text-red-600 border-2 border-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600');
      }
      
      if (isCompleted) {
        return cn(baseClasses, 'bg-blue-500 text-white dark:bg-blue-600');
      }
      
      if (isActive) {
        return cn(baseClasses, 'bg-white text-blue-600 border-2 border-blue-500 dark:bg-gray-800 dark:border-blue-500');
      }
      
      return cn(baseClasses, 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400');
    }
    
    if (variant === 'filled') {
      if (hasError) {
        return cn(baseClasses, 'bg-red-500 text-white dark:bg-red-600');
      }
      
      if (isCompleted) {
        return cn(baseClasses, 'bg-blue-500 text-white dark:bg-blue-600');
      }
      
      if (isActive) {
        return cn(baseClasses, 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400');
      }
      
      return cn(baseClasses, 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400');
    }
    
    if (variant === 'outlined') {
      if (hasError) {
        return cn(baseClasses, 'border-2 border-red-500 text-red-600 dark:border-red-600 dark:text-red-400');
      }
      
      if (isCompleted) {
        return cn(baseClasses, 'border-2 border-blue-500 text-blue-600 dark:border-blue-600 dark:text-blue-400');
      }
      
      if (isActive) {
        return cn(baseClasses, 'border-2 border-blue-500 text-blue-600 dark:border-blue-600 dark:text-blue-400');
      }
      
      return cn(baseClasses, 'border-2 border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400');
    }
    
    return '';
  };
  
  const getLineClasses = (isCompleted: boolean) => {
    const baseClasses = cn(sizeClasses[size].line, 'bg-gray-200 dark:bg-gray-700');
    
    if (isCompleted) {
      return cn(baseClasses, 'bg-blue-500 dark:bg-blue-600');
    }
    
    return baseClasses;
  };
  
  // Handle step click
  const handleStepClick = (stepId: number | string) => {
    if (readOnly) return;
    
    // Find step index
    const stepIndex = steps.findIndex(step => step.id === stepId);
    
    // Only allow clicking on previous steps or the next step
    if (stepIndex <= currentStepIndex + 1) {
      onChange(stepId);
    }
  };
  
  return (
    <div 
      className={cn(
        sizeClasses[size].container,
        orientation === 'horizontal' 
          ? 'flex items-center justify-between'
          : 'flex flex-col space-y-4',
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentStepIndex;
        const hasError = !!step.errorMessage;
        
        return (
          <div 
            key={step.id}
            className={cn(
              'relative',
              orientation === 'horizontal' ? 'flex-1' : 'flex',
              index === steps.length - 1 && orientation === 'horizontal' && 'flex-initial',
              stepClassName
            )}
          >
            {/* Step content */}
            <div 
              className={cn(
                orientation === 'horizontal' ? 'flex flex-col items-center' : 'flex items-center',
                isActive && activeStepClassName,
                isCompleted && completedStepClassName
              )}
              onClick={() => handleStepClick(step.id)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {/* Circle */}
              <div 
                className={cn(
                  getCircleClasses(isActive, isCompleted, hasError),
                  sizeClasses[size].circle,
                  iconClassName
                )}
              >
                {hasError ? (
                  <AlertCircle className={sizeClasses[size].icon} />
                ) : isCompleted ? (
                  <Check className={sizeClasses[size].icon} />
                ) : (
                  step.icon || (
                    <span>{index + 1}</span>
                  )
                )}
              </div>
              
              {/* Label and description */}
              <div className={cn(
                orientation === 'horizontal' ? 'mt-2 text-center' : 'ml-3',
                labelClassName
              )}>
                <div className={cn(
                  'font-medium',
                  isActive && 'text-blue-600 dark:text-blue-400',
                  isCompleted && 'text-blue-600 dark:text-blue-400',
                  !isActive && !isCompleted && 'text-gray-700 dark:text-gray-300',
                  hasError && 'text-red-600 dark:text-red-400'
                )}>
                  {step.label}
                  {step.optional && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
                      (Optional)
                    </span>
                  )}
                </div>
                
                {step.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                )}
                
                {hasError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {step.errorMessage}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  orientation === 'horizontal'
                    ? 'absolute top-[calc(50%-theme(spacing.8)/2)] left-[calc(50%+theme(spacing.4))] right-[calc(-50%+theme(spacing.4))]'
                    : 'absolute top-[calc(theme(spacing.8)+theme(spacing.2))] bottom-0 left-[calc(theme(spacing.4)-theme(spacing.0.5))]',
                  lineClassName
                )}
              >
                <motion.div
                  className={getLineClasses(isCompleted)}
                  initial={isCompleted ? { scaleX: 0, scaleY: 0 } : { scaleX: 0, scaleY: 0 }}
                  animate={{ 
                    scaleX: orientation === 'horizontal' && isCompleted ? 1 : 1, 
                    scaleY: orientation === 'vertical' && isCompleted ? 1 : 1 
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  style={{
                    transformOrigin: orientation === 'horizontal' ? 'left' : 'top',
                    height: orientation === 'horizontal' ? undefined : '100%',
                    width: orientation === 'vertical' ? undefined : '100%',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};