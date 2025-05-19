// frontend/src/contexts/NotificationContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Notification } from '@/types/notification';
import { getFromStorage, saveToStorage } from '@/utils/storage';

interface NotificationContextData {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
}

interface NotificationProviderProps {
  children: ReactNode;
  maxStoredNotifications?: number;
}

const NotificationContext = createContext<NotificationContextData>(
  {} as NotificationContextData
);

export const NotificationProvider = ({
  children,
  maxStoredNotifications = 50,
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications from storage on mount
  useEffect(() => {
    const storedNotifications = getFromStorage('notifications');
    if (storedNotifications) {
      setNotifications(storedNotifications);
    }
  }, []);
  
  // Save notifications to storage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      // Only store up to the maximum number of notifications
      const trimmedNotifications = notifications.slice(0, maxStoredNotifications);
      saveToStorage('notifications', trimmedNotifications);
    }
  }, [notifications, maxStoredNotifications]);
  
  const addNotification = (
    notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
  ) => {
    const newNotification: Notification = {
      id: uuidv4(),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Return the id in case it's needed
    return newNotification.id;
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    saveToStorage('notifications', []);
  };
  
  // Show a toast notification that is also added to the notification center
  const showToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    title?: string
  ) => {
    // Map type to notification type
    const notificationType = 
      type === 'success' ? 'success' :
      type === 'error' ? 'error' :
      type === 'warning' ? 'alert' :
      'system';
    
    // Add to notification center
    addNotification({
      title: title || (
        type === 'success' ? 'Success' :
        type === 'error' ? 'Error' :
        type === 'warning' ? 'Warning' :
        'Information'
      ),
      message,
      type: notificationType,
    });
    
    // Show toast
    toast[type](message, {
      duration: type === 'error' ? 5000 : 3000,
    });
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        showToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};