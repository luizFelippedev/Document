// src/hooks/useRealTimeNotificationsSync.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { socketService, socketEvents } from '@/lib/socket';
import { notificationService } from '@/services/notification.service';
import { useAuth } from './useAuth';
import { useNotification } from './useNotification';
import { Notification } from '@/types/notification';
import { NOTIFICATION_SETTINGS } from '@/config/constants';

/**
 * This hook synchronizes server-side notifications with the local notification context.
 * It listens for real-time notifications via WebSocket and fetches existing notifications from the API.
 */
export const useRealTimeNotificationsSync = () => {
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user } = useAuth();
  const { 
    addNotification, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    showToast
  } = useNotification();
  
  // Fetch notifications from the server
  const syncNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch notifications from API using the maxStored setting
      const notifications = await notificationService.getNotifications(
        1, 
        NOTIFICATION_SETTINGS.maxStored
      );
      
      // Add each notification to the context (if not already exists)
      notifications.forEach(notification => {
        // This will need to be adapted based on how you want to merge server notifications
        // with local notifications. You might want to check if they already exist first.
        addNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionLabel: notification.actionLabel,
          actionUrl: notification.actionUrl,
          data: notification.data
        });
        
        // If notification is already read on server, mark it as read locally
        if (notification.read) {
          markAsRead(notification.id);
        }
      });
      
      // Fetch unread count
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      
      return notifications;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to sync notifications';
      setError(errorMessage);
      
      // Only show error toast for non-connectivity issues
      if (err.message !== 'Network Error') {
        showToast('error', errorMessage);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, addNotification, markAsRead, showToast]);
  
  // Mark a notification as read both locally and on the server
  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      // Mark as read on server
      await notificationService.markAsRead(id);
      
      // Mark as read locally
      markAsRead(id);
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark notification as read';
      console.error(errorMessage, err);
      
      // Only show toast for non-connectivity issues
      if (err.message !== 'Network Error') {
        showToast('error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [markAsRead, showToast]);
  
  // Mark all notifications as read both locally and on the server
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mark all as read on server
      await notificationService.markAllAsRead();
      
      // Mark all as read locally
      markAllAsRead();
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark all notifications as read';
      console.error(errorMessage, err);
      
      // Only show toast for non-connectivity issues
      if (err.message !== 'Network Error') {
        showToast('error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [markAllAsRead, showToast]);
  
  // Delete a notification both locally and on the server
  const deleteNotification = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      // Delete on server
      await notificationService.deleteNotification(id);
      
      // Delete locally
      removeNotification(id);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete notification';
      console.error(errorMessage, err);
      
      // Only show toast for non-connectivity issues
      if (err.message !== 'Network Error') {
        showToast('error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [removeNotification, showToast]);
  
  // Setup WebSocket connection and event listeners
  useEffect(() => {
    if (!user) return;
    
    // Initial sync
    syncNotifications();
    
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
        // Add the new notification to context
        addNotification({
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          actionLabel: newNotification.actionLabel,
          actionUrl: newNotification.actionUrl,
          data: newNotification.data
        });
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
      }
    );
    
    // Listen for read notifications
    const unsubscribeRead = socketService.on<{id: string}>(
      socketEvents.notifications.read,
      (data) => {
        // Mark as read locally
        markAsRead(data.id);
      }
    );
    
    // Listen for read all notifications
    const unsubscribeReadAll = socketService.on(
      socketEvents.notifications.readAll,
      () => {
        // Mark all as read locally
        markAllAsRead();
        
        // Reset unread count
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
  }, [user, syncNotifications, addNotification, markAsRead, markAllAsRead]);
  
  return {
    loading,
    error,
    unreadCount,
    isConnected,
    syncNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  };
};