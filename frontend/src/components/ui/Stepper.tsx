// frontend/src/components/ui/Stepper.tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Step {
  id: number | string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
  completed?: boolean;
  disabled?: boolean;
}

export interface StepperProps {
  /** Array of step objects */
  steps: Step[];
  /** ID of the current active step */
  currentStep: number | string;
  /** Called when a step is clicked */
  onChange?: (step: number | string) => void;
  /** Whether steps before the current step are clickable */
  allowBackSteps?: boolean;
  /** Whether completed steps show a checkmark */
  showCheckmarks?: boolean;
  /** The orientation of the stepper */
  orientation?: 'horizontal' | 'vertical';
  /** The layout of step indicators */
  variant?: 'circles' | 'pills' | 'dots' | 'numbers';
  /** Whether steps should be connected with lines */
  connector?: boolean;
  /** Custom color for the active step */
  activeColor?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Stepper component for multi-step flows
 */
export const Stepper = ({
  steps,
  currentStep,
  onChange,
  allowBackSteps = true,
  showCheckmarks = true,
  orientation = 'horizontal',
  variant = 'circles',
  connector = true,
  activeColor = 'bg-blue-600 dark:bg-blue-500 text-white',
  className,
}: StepperProps) => {
  const [activeStep, setActiveStep] = useState<number | string>(currentStep);
  
  // Update active step when currentStep prop changes
  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);
  
  // Handle step click
  const handleStepClick = (step: Step) => {
    // Don't allow clicking on disabled steps
    if (step.disabled) return;
    
    // Don't allow clicking on future steps
    const stepIndex = steps.findIndex(s => s.id === step.id);
    const activeIndex = steps.findIndex(s => s.id === activeStep);
    
    if (!allowBackSteps && stepIndex > activeIndex) return;
    
    setActiveStep(step.id);
    onChange?.(step.id);
  };
  
  // Check if a step is active
  const isStepActive = (step: Step) => step.id === activeStep;
  
  // Check if a step is completed
  const isStepCompleted = (step: Step, index: number) => {
    if (step.completed !== undefined) return step.completed;
    
    const activeIndex = steps.findIndex(s => s.id === activeStep);
    return index < activeIndex;
  };
  
  // Render step indicator based on variant
  const renderStepIndicator = (step: Step, index: number) => {
    const isActive = isStepActive(step);
    const isCompleted = isStepCompleted(step, index);
    
    // Base classes for the indicator
    const baseClasses = cn(
      'flex items-center justify-center transition-colors',
      step.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      isActive 
        ? activeColor
        : isCompleted 
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    );
    
    // Variant-specific classes and content
    const variantMap = {
      circles: {
        containerClass: cn(baseClasses, 'rounded-full', orientation === 'horizontal' ? 'h-8 w-8' : 'h-10 w-10'),
        content: isCompleted && showCheckmarks 
          ? <Check size={16} /> 
          : (step.icon || (variant === 'numbers' ? index + 1 : '')),
      },
      pills: {
        containerClass: cn(baseClasses, 'rounded-full px-3 py-1 text-sm'),
        content: step.label,
      },
      dots: {
        containerClass: cn(baseClasses, 'rounded-full', orientation === 'horizontal' ? 'h-3 w-3' : 'h-4 w-4'),
        content: null,
      },
      numbers: {
        containerClass: cn(baseClasses, 'rounded-full', orientation === 'horizontal' ? 'h-8 w-8' : 'h-10 w-10'),
        content: isCompleted && showCheckmarks ? <Check size={16} /> : index + 1,
      },
    };
    
    const { containerClass, content } = variantMap[variant];
    
    return (
      <div className={containerClass}>
        {content}
      </div>
    );
  };
  
  // Horizontal stepper layout
  if (orientation === 'horizontal') {
    return (
      <div 
        className={cn(
          'flex items-center justify-between',
          className
        )}
      >
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={cn(
              'flex flex-1 items-center',
              index === steps.length - 1 && 'flex-initial'
            )}
          >
            {/* Step */}
            <div 
              className="flex flex-col items-center"
              onClick={() => handleStepClick(step)}
            >
              {/* Step indicator */}
              {renderStepIndicator(step, index)}
              
              {/* Step label */}
              {variant !== 'pills' && (
                <div 
                  className={cn(
                    'mt-2 text-xs text-center',
                    isStepActive(step) 
                      ? 'font-medium text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400',
                    step.disabled && 'opacity-50'
                  )}
                >
                  <div>{step.label}</div>
                  {step.description && (
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {step.description}
                    </div>
                  )}
                  {step.optional && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      (Optional)
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Connector line */}
            {connector && index < steps.length - 1 && (
              <div className="flex-1 flex items-center justify-center mx-2">
                <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 relative">
                  <motion.div
                    className="absolute inset-0 h-full bg-blue-600 dark:bg-blue-500 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ 
                      scaleX: isStepCompleted(step, index) ? 1 : 0 
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Vertical stepper layout
  return (
    <div 
      className={cn(
        'flex flex-col space-y-4',
        className
      )}
    >
      {steps.map((step, index) => (
        <div key={step.id} className="flex">
          {/* Step indicator and connector line */}
          <div className="flex flex-col items-center">
            {/* Step indicator */}
            <div onClick={() => handleStepClick(step)}>
              {renderStepIndicator(step, index)}
            </div>
            
            {/* Connector line */}
            {connector && index < steps.length - 1 && (
              <div className="w-0.5 h-full flex-1 bg-gray-200 dark:bg-gray-700 mx-auto my-1 relative">
                <motion.div
                  className="absolute inset-0 w-full bg-blue-600 dark:bg-blue-500 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={{ 
                    scaleY: isStepCompleted(step, index) ? 1 : 0 
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </div>
            )}
          </div>
          
          {/* Step content */}
          <div 
            className={cn(
              'flex-1 ml-4 cursor-pointer',
              step.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => handleStepClick(step)}
          >
            <div 
              className={cn(
                'font-medium',
                isStepActive(step) 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {step.label}
              {step.optional && (
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                  (Optional)
                </span>
              )}
            </div>
            
            {step.description && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {step.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};