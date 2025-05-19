// frontend/src/components/notifications/NotificationCenter.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/hooks/useNotification';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Settings, 
  MessageCircle, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';
import { Notification } from '@/types/notification';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [notificationsFilter, setNotificationsFilter] = useState<'all' | 'system' | 'message' | 'alert'>('all');
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotification();
  
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  
  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationPanelRef.current && 
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Filter notifications based on tab and filter
  const filteredNotifications = notifications.filter(notification => {
    // First filter by read/unread
    if (activeTab === 'unread' && notification.read) {
      return false;
    }
    
    // Then filter by type
    if (notificationsFilter === 'all') {
      return true;
    }
    
    return notification.type === notificationsFilter;
  });
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info size={16} className="text-blue-500 dark:text-blue-400" />;
      case 'message':
        return <MessageCircle size={16} className="text-green-500 dark:text-green-400" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500 dark:text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500 dark:text-red-400" />;
      default:
        return <Bell size={16} className="text-gray-500 dark:text-gray-400" />;
    }
  };
  
  return (
    <>
      {/* Notification Toggle Button */}
      <button
        className="relative p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-block h-4 w-4 rounded-full bg-red-500 text-xs text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={notificationPanelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-16 z-50 w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {(activeTab === 'all' || activeTab === 'unread') && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    disabled={!filteredNotifications.some(n => !n.read)}
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium text-center",
                  activeTab === 'all'
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium text-center",
                  activeTab === 'unread'
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                onClick={() => setActiveTab('unread')}
              >
                Unread 
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 w-5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium text-center",
                  activeTab === 'settings'
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={16} className="mx-auto" />
              </button>
            </div>
            
            {/* Filter (only visible for notifications tabs) */}
            {activeTab !== 'settings' && (
              <div className="flex p-2 space-x-1 bg-gray-50 dark:bg-gray-800 overflow-x-auto scrollbar-hide">
                <button
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium",
                    notificationsFilter === 'all'
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => setNotificationsFilter('all')}
                >
                  All
                </button>
                <button
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium",
                    notificationsFilter === 'system'
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => setNotificationsFilter('system')}
                >
                  System
                </button>
                <button
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium",
                    notificationsFilter === 'message'
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => setNotificationsFilter('message')}
                >
                  Messages
                </button>
                <button
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium",
                    notificationsFilter === 'alert'
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => setNotificationsFilter('alert')}
                >
                  Alerts
                </button>
              </div>
            )}
            
            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'settings' ? (
                <div className="p-4">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                    Notification Preferences
                  </h4>
                  <div className="space-y-4">
                    <Switch
                      checked={true}
                      onChange={() => {}}
                      label="Email Notifications"
                      description="Receive email notifications for important updates"
                    />
                    <Switch
                      checked={true}
                      onChange={() => {}}
                      label="Push Notifications"
                      description="Receive push notifications in the browser"
                    />
                    <Switch
                      checked={false}
                      onChange={() => {}}
                      label="SMS Notifications"
                      description="Receive text messages for critical alerts"
                    />
                    
                    <div className="pt-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Notification Categories
                      </h5>
                      <div className="space-y-3">
                        <Switch
                          checked={true}
                          onChange={() => {}}
                          label="System Updates"
                          size="sm"
                        />
                        <Switch
                          checked={true}
                          onChange={() => {}}
                          label="New Messages"
                          size="sm"
                        />
                        <Switch
                          checked={true}
                          onChange={() => {}}
                          label="Project Updates"
                          size="sm"
                        />
                        <Switch
                          checked={false}
                          onChange={() => {}}
                          label="Marketing"
                          size="sm"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => clearAllNotifications()}
                        className="mt-3"
                        leftIcon={<Trash2 size={14} />}
                      >
                        Clear All Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mb-4">
                    <Bell size={24} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <h5 className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                    No notifications
                  </h5>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {activeTab === 'unread' 
                      ? "You don't have any unread notifications" 
                      : "You don't have any notifications yet"}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                      getIcon={getIcon}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {(activeTab === 'all' || activeTab === 'unread') && filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  onClick={() => {/* Show all notifications page */}}
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
  getIcon: (type: string) => React.ReactNode;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onRemove,
  getIcon,
}: NotificationItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={cn(
        "p-4 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors duration-200",
        !notification.read && "bg-blue-50 dark:bg-blue-900/20",
        isHovered && "bg-gray-50 dark:bg-gray-700/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {getIcon(notification.type)}
          </div>
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
              
              {notification.actionLabel && (
                <button
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => {
                    onMarkAsRead();
                    // Handle action
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  {notification.actionLabel}
                </button>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <Clock size={12} className="mr-1" />
                {formatRelativeTime(notification.createdAt)}
              </p>
            </div>
            
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500"></span>
            )}
          </div>
          
          {/* Actions (visible on hover) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end mt-2 space-x-2"
              >
                {!notification.read ? (
                  <button
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={onMarkAsRead}
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <button
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={onRemove}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};