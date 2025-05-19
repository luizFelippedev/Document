// frontend/src/components/ui/Tabs.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underlined' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  vertical?: boolean;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  vertical = false,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
  children,
}: TabsProps) => {
  const [activeTabWidth, setActiveTabWidth] = useState(0);
  const [activeTabLeft, setActiveTabLeft] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || '';
  
  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Calculate tab indicator position
  useEffect(() => {
    if (vertical || variant === 'pills' || variant === 'minimal') return;
    
    const activeTabElement = tabsRef.current[activeTabIndex];
    
    if (activeTabElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      setActiveTabWidth(tabRect.width);
      setActiveTabLeft(tabRect.left - containerRect.left);
    }
  }, [activeTab, activeTabIndex, vertical, variant]);
  
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2.5',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2.5 px-4',
  };
  
  const getTabClasses = (isActive: boolean) => {
    const baseClasses = 'outline-none transition font-medium';
    const sizeClass = sizeClasses[size];
    
    let variantClass = '';
    
    if (variant === 'default') {
      variantClass = cn(
        'border-b-2',
        isActive 
          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
          : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      );
    } else if (variant === 'pills') {
      variantClass = cn(
        'rounded-full',
        isActive 
          ? 'bg-blue-600 text-white dark:bg-blue-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
      );
    } else if (variant === 'underlined') {
      variantClass = cn(
        'border-b-2',
        isActive 
          ? 'border-blue-600 text-gray-900 dark:border-blue-400 dark:text-white' 
          : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      );
    } else if (variant === 'minimal') {
      variantClass = cn(
        isActive 
          ? 'text-gray-900 dark:text-white font-semibold' 
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      );
    }
    
    return cn(
      baseClasses,
      sizeClass,
      variantClass,
      isActive ? activeTabClassName : '',
      tabClassName
    );
  };
  
  const containerClasses = cn(
    'relative',
    vertical ? 'flex' : 'block',
    className
  );
  
  const tabsClasses = cn(
    vertical 
      ? 'flex flex-col space-y-1' 
      : 'flex space-x-1 border-b border-gray-200 dark:border-gray-700',
    variant === 'minimal' ? 'border-b-0' : '',
    fullWidth && !vertical ? 'w-full' : '',
    !vertical && 'overflow-x-auto scrollbar-hide'
  );
  
  return (
    <div className={containerClasses}>
      {/* Mobile dropdown for horizontal tabs */}
      {isMobile && !vertical && variant !== 'minimal' && (
        <div className="sm:hidden mb-4">
          <button
            type="button"
            className="flex items-center justify-between w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span>{activeTabLabel}</span>
            <ChevronDown
              className={`ml-2 h-5 w-5 transition-transform ${showMobileMenu ? 'transform rotate-180' : ''}`}
            />
          </button>
          
          {showMobileMenu && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onChange(tab.id);
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    'block w-full text-left px-4 py-2 text-sm',
                    tab.id === activeTab
                      ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center">
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full px-2 py-0.5">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Tab list */}
      <div 
        className={cn(tabsClasses, isMobile && !vertical && variant !== 'minimal' ? 'hidden sm:flex' : '')} 
        ref={containerRef}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => {
              tabsRef.current[index] = el;
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              getTabClasses(activeTab === tab.id),
              fullWidth && !vertical ? 'flex-1 text-center' : ''
            )}
          >
            <div className="flex items-center justify-center">
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "ml-2 text-xs rounded-full px-2 py-0.5",
                  activeTab === tab.id
                    ? "bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
        
        {/* Animated tab indicator */}
        {!vertical && variant === 'underlined' && activeTabIndex !== -1 && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            initial={false}
            animate={{
              left: activeTabLeft,
              width: activeTabWidth,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </div>
      
      {/* Tab content */}
      {children && (
        <div className={cn('mt-4', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
};