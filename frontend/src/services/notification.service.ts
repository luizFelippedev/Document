// src/services/notification.service.ts
import { api } from '@/lib/axios';
import { Notification } from '@/types/notification';
import { socketEvents, socketService } from '@/lib/socket';

export const notificationService = {
  /**
   * Get all notifications
   */
  async getNotifications(page = 1, itemsPerPage = 10, unreadOnly = false, type?: string) {
    const params: Record<string, any> = { page, itemsPerPage };
    
    if (unreadOnly) {
      params.read = false;
    }
    
    if (type) {
      params.type = type;
    }
    
    const response = await api.get('/notifications', { params });
    return response.data.notifications;
  },
  
  /**
   * Get a notification by ID
   */
  async getNotification(id: string) {
    const response = await api.get(`/notifications/${id}`);
    return response.data.notification;
  },
  
  /**
   * Mark a notification as read
   */
  async markAsRead(id: string) {
    const response = await api.put(`/notifications/${id}/read`, {});
    
    // Emit socket event for read status
    // socketService.emit(socketEvents.notifications.read, { id });
    
    return response.data.notification;
  },
  
  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all', {});
    
    // Emit socket event for read all status
    // socketService.emit(socketEvents.notifications.readAll);
    
    return response.data;
  },
  
  /**
   * Delete a notification
   */
  async deleteNotification(id: string) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
  
  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    const response = await api.delete('/notifications');
    return response.data;
  },
  
  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
  
  /**
   * Update notification settings
   */
  async updateSettings(settings: { email: boolean; push: boolean; inApp: boolean }) {
    const response = await api.put('/notifications/settings', settings);
    return response.data.settings;
  },
  
  /**
   * Get notification preferences
   */
  async getSettings() {
    const response = await api.get('/notifications/settings');
    return response.data.settings;
  },
  
  /**
   * Setup real-time notification listener
   * Returns an unsubscribe function
   */
  onNewNotification(callback: (notification: Notification) => void) {
    return socketService.on<Notification>(socketEvents.notifications.new, callback);
  }
};