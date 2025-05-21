// frontend/src/components/ui/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  /** Additional class name */
  className?: string;
  /** Show system theme option */
  showSystem?: boolean;
  /** Use icons only */
  iconsOnly?: boolean;
  /** Display as a dropdown */
  dropdown?: boolean;
  /** Display as a list */
  list?: boolean;
  /** Size of the toggle */
  size?: 'sm' | 'md' | 'lg';
  /** Variant style */
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Theme toggle component for switching between light/dark modes
 */
export const ThemeToggle = ({
  className,
  showSystem = true,
  iconsOnly = false,
  dropdown = false,
  list = false,
  size = 'md',
  variant = 'default',
}: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'h-8 w-8',
          icon: 'h-4 w-4',
          text: 'text-xs',
        };
      case 'lg':
        return {
          button: 'h-12 w-12',
          icon: 'h-6 w-6',
          text: 'text-base',
        };
      default:
        return {
          button: 'h-10 w-10',
          icon: 'h-5 w-5',
          text: 'text-sm',
        };
    }
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800';
      case 'ghost':
        return 'hover:bg-gray-100 dark:hover:bg-gray-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
    }
  };

  const sizeStyles = getSizeStyles();

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  // Toggle between light and dark directly
  const toggleTheme = () => {
    if (dropdown || list) {
      setIsOpen(!isOpen);
    } else {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  };

  // Get the current theme icon
  const getThemeIcon = () => {
    switch (theme === 'system' ? resolvedTheme : theme) {
      case 'dark':
        return <Moon className={cn('transition-transform', sizeStyles.icon)} />;
      case 'light':
      default:
        return <Sun className={cn('transition-transform', sizeStyles.icon)} />;
    }
  };

  // Dropdown or list toggle
  if (dropdown || list) {
    return (
      <div className="relative">
        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-full transition-colors',
            getVariantStyles(),
            sizeStyles.button,
            className,
          )}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {getThemeIcon()}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10',
                list ? 'w-auto' : 'w-40',
              )}
            >
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Theme
              </div>

              {/* Light theme option */}
              <button
                className={cn(
                  'w-full flex items-center px-3 py-2 text-left',
                  sizeStyles.text,
                  theme === 'light'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </button>

              {/* Dark theme option */}
              <button
                className={cn(
                  'w-full flex items-center px-3 py-2 text-left',
                  sizeStyles.text,
                  theme === 'dark'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </button>

              {/* System theme option */}
              {showSystem && (
                <button
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-left',
                    sizeStyles.text,
                    theme === 'system'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                  onClick={() => handleThemeChange('system')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Simple toggle button
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center rounded-full transition-colors',
        getVariantStyles(),
        sizeStyles.button,
        className,
      )}
      onClick={toggleTheme}
      aria-label={`Switch to ${
        resolvedTheme === 'dark' ? 'light' : 'dark'
      } theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={resolvedTheme === 'dark' ? 'dark' : 'light'}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className={sizeStyles.icon} />
          ) : (
            <Sun className={sizeStyles.icon} />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};
