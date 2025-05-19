// frontend/src/components/ui/Select.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  labelClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline' | 'unstyled';
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error,
  label,
  required = false,
  multiple = false,
  searchable = false,
  className,
  buttonClassName,
  optionsClassName,
  labelClassName,
  size = 'md',
  variant = 'default',
}: SelectProps) => {
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter options based on search query
  const filteredOptions = searchable && search 
    ? options.filter(option => 
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (searchable) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
        }
      };
      
      searchInputRef.current?.addEventListener('keydown', handleKeyDown);
      
      return () => {
        searchInputRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [searchable]);
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1.5 pl-3 pr-8 text-sm',
    md: 'py-2 pl-3 pr-10 text-sm',
    lg: 'py-2.5 pl-4 pr-10 text-base',
  };
  
  // Variant classes
  const getVariantClasses = () => {
    if (variant === 'default') {
      return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500';
    }
    
    if (variant === 'filled') {
      return 'bg-gray-100 dark:bg-gray-700 border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500';
    }
    
    if (variant === 'outline') {
      return 'bg-transparent border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500';
    }
    
    if (variant === 'unstyled') {
      return 'bg-transparent border-none shadow-none px-0 pl-0 pr-6';
    }
    
    return '';
  };
  
  // Get selected options
  const getSelectedOptions = () => {
    if (multiple) {
      const selectedValues = value as string[];
      return options.filter(option => selectedValues.includes(option.value));
    } else {
      return options.find(option => option.value === value);
    }
  };
  
  // Get display value
  const getDisplayValue = () => {
    if (multiple) {
      const selectedOptions = getSelectedOptions() as SelectOption[];
      
      if (selectedOptions.length === 0) {
        return placeholder;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <div 
              key={option.value}
              className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-xs py-0.5 pl-1.5 pr-0.5"
            >
              {option.label}
              <button
                type="button"
                className="ml-1 rounded-md p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  const newValues = (value as string[]).filter(v => v !== option.value);
                  onChange(newValues);
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      );
    } else {
      const selectedOption = getSelectedOptions() as SelectOption | undefined;
      
      if (!selectedOption) {
        return placeholder;
      }
      
      return (
        <div className="flex items-center">
          {selectedOption.icon && (
            <span className="mr-2 flex items-center">{selectedOption.icon}</span>
          )}
          <span>{selectedOption.label}</span>
        </div>
      );
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label 
          className={cn(
            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <Listbox 
        value={value} 
        onChange={onChange}
        multiple={multiple}
        disabled={disabled}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              className={cn(
                "relative w-full cursor-default rounded-md shadow-sm text-left focus:outline-none",
                getVariantClasses(),
                sizeClasses[size],
                error && "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500 dark:focus:border-red-500",
                disabled && "opacity-60 cursor-not-allowed",
                buttonClassName
              )}
            >
              <span className={cn(
                "block truncate",
                !value || (Array.isArray(value) && value.length === 0) && "text-gray-500 dark:text-gray-400"
              )}>
                {getDisplayValue()}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown 
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            
            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={cn(
                  "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
                  optionsClassName
                )}
              >
                {searchable && (
                  <div className="sticky top-0 py-1 px-2 bg-white dark:bg-gray-800 z-10">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full py-1.5 pl-8 pr-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        autoComplete="off"
                      />
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      {search && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearch('');
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, selected, disabled }) => cn(
                        "relative cursor-default select-none py-2 pl-10 pr-4",
                        active && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200",
                        selected && !active && "text-blue-700 dark:text-blue-200",
                        disabled && "opacity-50 cursor-not-allowed",
                        !active && !selected && "text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            {option.icon && (
                              <span className="mr-2 flex items-center">{option.icon}</span>
                            )}
                            <span 
                              className={cn(
                                "block truncate",
                                selected ? "font-medium" : "font-normal"
                              )}
                            >
                              {option.label}
                            </span>
                          </div>
                          
                          {selected && (
                            <span
                              className={cn(
                                "absolute inset-y-0 left-0 flex items-center pl-3",
                                active ? "text-blue-700 dark:text-blue-200" : "text-blue-600 dark:text-blue-300"
                              )}
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};