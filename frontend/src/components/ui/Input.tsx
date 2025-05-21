// frontend/src/components/ui/Input.tsx
'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Element to display on the left side of the input */
  leftElement?: React.ReactNode;
  /** Element to display on the right side of the input */
  rightElement?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Whether the input is loading */
  loading?: boolean;
  /** The visual state of the input */
  state?: 'default' | 'error' | 'success' | 'warning';
  /** The shape variant of the input */
  variant?: 'default' | 'filled' | 'underlined';
  /** Display a clear button when the input has a value */
  clearable?: boolean;
  /** Called when the clear button is clicked */
  onClear?: () => void;
  /** Whether to adjust the height of textarea automatically */
  autoSize?: boolean;
}

/**
 * Input component that supports left and right elements, error display, and various states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    leftElement,
    rightElement,
    error,
    loading,
    state = 'default',
    variant = 'default',
    clearable = false,
    onClear,
    autoSize,
    ...props
  }, ref) => {
    const [localRef, setLocalRef] = useState<HTMLInputElement | null>(null);
    
    // Combine our local ref with the forwarded ref
    const handleRef = (el: HTMLInputElement) => {
      setLocalRef(el);
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
      }
    };
    
    // Determine state styling
    const getStateStyles = () => {
      switch (state) {
        case 'error':
          return 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500';
        case 'success':
          return 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600 dark:focus:border-green-500';
        case 'warning':
          return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-600 dark:focus:border-yellow-500';
        default:
          return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400';
      }
    };
    
    // Determine variant styling
    const getVariantStyles = () => {
      switch (variant) {
        case 'filled':
          return 'bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-800';
        case 'underlined':
          return 'border-t-0 border-l-0 border-r-0 rounded-none px-0 bg-transparent';
        default:
          return 'bg-white dark:bg-gray-800';
      }
    };
    
    // Determine if we should show the clear button
    const showClearButton = clearable && props.value && props.value.toString().length > 0;
    
    // Handle clear button click
    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (localRef) {
        // Clear the input value and trigger change event
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(localRef, '');
          const event = new Event('input', { bubbles: true });
          localRef.dispatchEvent(event);
        }
      }
    };
    
    const inputClasses = cn(
      'block w-full px-3 py-2 text-sm rounded-md transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-opacity-50',
      getStateStyles(),
      getVariantStyles(),
      // If we have left/right elements, adjust padding
      leftElement && 'pl-10',
      rightElement && 'pr-10',
      state === 'error' && 'placeholder-red-300 dark:placeholder-red-400',
      loading && 'animate-pulse',
      className
    );
    
    return (
      <div className="relative">
        {/* Left element (icon, etc.) */}
        {leftElement && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
            {leftElement}
          </div>
        )}
        
        {/* Input element */}
        <input
          ref={handleRef}
          type={type}
          className={inputClasses}
          aria-invalid={state === 'error'}
          {...props}
        />
        
        {/* Right element (icon, clear button, etc.) */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {showClearButton && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              onClick={handleClear}
              tabIndex={-1}
              aria-label="Clear input"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {rightElement}
        </div>
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';