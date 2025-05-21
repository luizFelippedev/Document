// frontend/src/components/layout/MainLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/config/routes';
import { APP_NAME } from '@/config/constants';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  X,
  Home,
  Folder,
  Award,
  User,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Plus,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items
  const navItems = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD.ROOT,
      icon: <Home size={20} />,
      active: pathname === ROUTES.DASHBOARD.ROOT,
    },
    {
      name: 'Projects',
      href: ROUTES.DASHBOARD.PROJECTS.ROOT,
      icon: <Folder size={20} />,
      active: pathname.startsWith(ROUTES.DASHBOARD.PROJECTS.ROOT),
    },
    {
      name: 'Certificates',
      href: ROUTES.DASHBOARD.CERTIFICATES.ROOT,
      icon: <Award size={20} />,
      active: pathname.startsWith(ROUTES.DASHBOARD.CERTIFICATES.ROOT),
    },
    {
      name: 'Profile',
      href: ROUTES.DASHBOARD.PROFILE.ROOT,
      icon: <User size={20} />,
      active: pathname.startsWith(ROUTES.DASHBOARD.PROFILE.ROOT),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center text-lg font-bold mr-2">
              {APP_NAME.charAt(0)}
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Quick actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="mb-2"
            leftIcon={<Plus size={16} />}
          >
            New Project
          </Button>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            leftIcon={<Plus size={16} />}
          >
            Add Certificate
          </Button>
        </div>

        {/* User profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.name || 'User'}
              size="sm"
            />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User Name'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={() => {}}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        {/* Logo and close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center text-lg font-bold mr-2">
              {APP_NAME.charAt(0)}
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile navigation */}
        <nav className="py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile user profile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.name || 'User'}
              size="sm"
            />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User Name'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={() => {}}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Search (placeholder) */}
          <div className="hidden sm:block flex-1 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full py-1.5 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-gray-300 dark:focus:bg-gray-800 dark:focus:border-gray-600"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Header right */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <button className="relative p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="hidden sm:block">
              <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.name || 'User'}
                  size="sm"
                />
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};
