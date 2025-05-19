// frontend/src/components/ui/Dropdown.tsx
'use client';

import React, { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: number;
  className?: string;
  itemsClassName?: string;
  triggerClassName?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  groupLabel?: string;
}

export const Dropdown = ({
  trigger,
  items,
  align = 'left',
  width = 200,
  className,
  itemsClassName,
  triggerClassName,
  isOpen,
  setIsOpen,
  groupLabel,
}: DropdownProps) => {
  // Calculate position classes
  const getPositionClasses = () => {
    if (align === 'left') {
      return 'left-0 origin-top-left';
    }
    return 'right-0 origin-top-right';
  };
  
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      {({ open }) => {
        // Allow external control of the menu state
        if (setIsOpen && open !== isOpen) {
          setIsOpen(open);
        }
        
        return (
          <>
            <Menu.Button className={triggerClassName}>
              {trigger}
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={cn(
                  "absolute z-50 mt-2 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                  getPositionClasses(),
                  itemsClassName
                )}
                style={{ width: `${width}px` }}
              >
                {groupLabel && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {groupLabel}
                  </div>
                )}
                
                <div className="py-1">
                  {items.map((item, index) => (
                    <Menu.Item key={index} disabled={item.disabled}>
                      {({ active }) => (
                        <button
                          onClick={item.onClick}
                          className={cn(
                            active 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300',
                            item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                            'flex items-center w-full text-left px-4 py-2 text-sm',
                            item.className
                          )}
                          disabled={item.disabled}
                        >
                          {item.icon && (
                            <span className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400">
                              {item.icon}
                            </span>
                          )}
                          {item.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
};

// Button Dropdown (with default trigger)
export interface ButtonDropdownProps extends Omit<DropdownProps, 'trigger'> {
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export const ButtonDropdown = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  ...props
}: ButtonDropdownProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  };
  
  const trigger = (
    <div className={cn(
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      sizeClasses[size],
      variantClasses[variant]
    )}>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      <ChevronDown className="ml-2 -mr-0.5 h-4 w-4" />
    </div>
  );
  
  return <Dropdown trigger={trigger} {...props} />;
};