// src/components/ui/Tabs.tsx
import React from 'react';
import { cn } from '@/utils/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  // Determine sizes based on size prop
  const sizeClasses = {
    sm: 'text-sm py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2 px-4',
  };
  
  // Determine variant styles
  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100';
      case 'underline':
        return isActive
          ? 'border-b-2 border-primary text-primary'
          : 'border-b-2 border-transparent hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100';
      default:
        return isActive
          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex border-b border-gray-200 dark:border-gray-700 space-x-1',
          variant === 'underline' ? 'border-b-0' : '',
          variant === 'pills'
            ? 'p-1 bg-gray-100 dark:bg-gray-800 rounded-lg'
            : '',
          fullWidth && 'w-full',
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'relative transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md font-medium',
              sizeClasses[size],
              getVariantClasses(activeTab === tab.id),
              tab.disabled && 'opacity-50 cursor-not-allowed',
              fullWidth && 'flex-1',
            )}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <div className="flex items-center justify-center">
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Implementação alternativa mais completa de Tabs com subcomponentes
// Descomente para usar se precisar de uma versão mais similar à do Radix UI

/*
// Tabs Component
interface TabsRootProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsRootProps) {
  const [tabValue, setTabValue] = React.useState(defaultValue || '');
  
  const contextValue = React.useMemo(() => ({
    value: value !== undefined ? value : tabValue,
    onValueChange: onValueChange || setTabValue,
  }), [value, tabValue, onValueChange]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tabs List Component
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-gray-200 dark:border-gray-700 space-x-1',
        className
      )}
    >
      {children}
    </div>
  );
}

// Tabs Trigger Component
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({
  value,
  children,
  disabled = false,
  className,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => {
        if (!disabled) {
          onValueChange(value);
        }
      }}
    >
      {children}
    </button>
  );
}

// Tabs Content Component
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({
  value,
  children,
  className,
}: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? 'active' : 'inactive'}
      className={cn('mt-2', className)}
    >
      {children}
    </div>
  );
}
*/