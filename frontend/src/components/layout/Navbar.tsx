// frontend/src/components/layout/Navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ROUTES } from "@/config/routes";
import { APP_NAME } from "@/config/constants";
import {
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";

interface NavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Navbar = ({ toggleSidebar, sidebarOpen }: NavbarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New project comment",
      message: "John Doe commented on your project",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Certificate approved",
      message: "Your certificate has been verified",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "System update",
      message: "The platform will be updated tonight",
      time: "3 hours ago",
      read: true,
    },
  ]);

  const { user, logout } = useAuth();
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults([
        {
          id: 1,
          type: "project",
          title: "React Dashboard",
          url: "/projects/1",
        },
        {
          id: 2,
          type: "certificate",
          title: "JavaScript Advanced",
          url: "/certificates/2",
        },
        {
          id: 3,
          type: "project",
          title: "React Native App",
          url: "/projects/3",
        },
      ]);
      setSearchLoading(false);
    }, 500);
  };

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.AUTH.LOGIN);
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true })),
    );
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-40 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href={ROUTES.DASHBOARD.ROOT}
              className="flex items-center ml-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500 text-white font-bold">
                {APP_NAME.charAt(0)}
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white hidden md:block">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Middle */}
          <div className="hidden md:block flex-1 mx-8">
            <div className="relative w-full max-w-lg mx-auto">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search projects, certificates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:border-blue-500 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setSearchQuery("")}
                    >
                      <X
                        size={16}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      />
                    </button>
                  )}
                </div>
              </form>

              <AnimatePresence>
                {searchOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute mt-2 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 border border-gray-200 dark:border-gray-700"
                    ref={searchRef}
                  >
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Search Results
                      </h3>
                      {searchLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner size="small" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {searchResults.map((result) => (
                            <Link
                              key={result.id}
                              href={result.url}
                              className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    result.type === "project"
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-green-100 text-green-600"
                                  } dark:bg-gray-700`}
                                >
                                  {result.type === "project" ? "P" : "C"}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {result.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {result.type.charAt(0).toUpperCase() +
                                      result.type.slice(1)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={20} />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <button
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              !notification.read
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Bell size={16} />
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="ml-2 flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-xs text-center text-blue-600 dark:text-blue-400 hover:underline py-1">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || "User"}
                  size="sm"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={ROUTES.DASHBOARD.PROFILE}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User size={16} className="mr-3 text-gray-500" />
                        Profile
                      </Link>
                      <Link
                        href={ROUTES.DASHBOARD.SETTINGS}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings size={16} className="mr-3 text-gray-500" />
                        Settings
                      </Link>
                      <Link
                        href="/help"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <HelpCircle size={16} className="mr-3 text-gray-500" />
                        Help Center
                      </Link>
                    </div>

                    <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
          >
            <form onSubmit={handleSearch}>
              <Input
                type="search"
                placeholder="Search projects, certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
