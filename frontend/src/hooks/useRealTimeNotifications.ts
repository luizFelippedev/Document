// src/hooks/useRealTimeNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { socketService, socketEvents } from '@/lib/socket';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types/notification';
import { useAuth } from './useAuth';

interface UseRealTimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<Notification | null>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  fetchNotifications: () => Promise<Notification[]>;
  fetchUnreadCount: () => Promise<number>;
  isConnected: boolean;
}

export const useRealTimeNotifications = (): UseRealTimeNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socketService.isConnected());
  
  const { user } = useAuth();
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await notificationService.getNotifications(1, 20);
      setNotifications(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch notifications';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return 0;
    
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (err: any) {
      console.error('Failed to fetch unread notification count:', err);
      return 0;
    }
  }, [user]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedNotification = await notificationService.markAsRead(id);
      
      // Update notifications list
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return updatedNotification;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark notification as read';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await notificationService.markAllAsRead();
      
      // Update all notifications as read
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark all notifications as read';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await notificationService.deleteNotification(id);
      
      // Remove notification from list
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      // Update unread count if it was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete notification';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [notifications]);
  
  // Setup socket connection and event listeners
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();
    
    // Setup socket connection status check
    const checkConnection = () => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
    };
    
    // Check initial connection
    checkConnection();
    
    // Setup interval to check connection
    const connectionInterval = setInterval(checkConnection, 5000);
    
    // Listen for new notifications
    const unsubscribeNew = socketService.on<Notification>(
      socketEvents.notifications.new, 
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );
    
    // Listen for read notifications
    const unsubscribeRead = socketService.on<{id: string}>(
      socketEvents.notifications.read,
      (data) => {
        const notificationId = data.id;
        setNotifications(prev => 
          prev.map(notif => notif.id === notificationId ? { ...notif, read: true } : notif)
        );
      }
    );
    
    // Listen for read all notifications
    const unsubscribeReadAll = socketService.on(
      socketEvents.notifications.readAll,
      () => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    );
    
    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeReadAll();
    };
  }, [user, fetchNotifications, fetchUnreadCount]);
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchUnreadCount,
    isConnected
  };
};