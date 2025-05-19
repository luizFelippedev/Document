// frontend/src/components/ui/ThemeToggle.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Make sure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'anticipate' }}
      >
        {theme === 'light' ? (
          <Sun size={20} />
        ) : (
          <Moon size={20} />
        )}
      </motion.div>
    </button>
  );
};

export const ThemeSelect = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const options = [
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
  ];
  
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            theme === option.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span className="mr-1.5">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
};