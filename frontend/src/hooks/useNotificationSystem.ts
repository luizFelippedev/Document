// frontend/src/hooks/useNotificationSystem.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { socketService, socketEvents } from "@/lib/socket";
import { notificationService } from "@/services/notification.service";
import { Notification } from "@/types/notification";
import { useAuth } from "./useAuth";
import { useNotification } from "@/contexts/NotificationContext";
import { NOTIFICATION_SETTINGS } from "@/config/constants";

/**
 * Hook unificado para gerenciar notificações em tempo real
 *
 * Responsabilidades:
 * - Sincroniza notificações entre servidor e cliente
 * - Gerencia estado local de notificações
 * - Manipula eventos de websocket para atualizações em tempo real
 * - Fornece métodos para interagir com notificações (marcar como lido, excluir, etc.)
 */
export const useNotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  const {
    addNotification,
    markAsRead: markLocalAsRead,
    markAllAsRead: markAllLocalAsRead,
    removeNotification,
    showToast,
  } = useNotification();

  // Fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      const data = await notificationService.getNotifications(
        1,
        NOTIFICATION_SETTINGS.maxStored,
      );
      setNotifications(data);

      // Sincronizar com o contexto local
      data.forEach((notification) => {
        addNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionLabel: notification.actionLabel,
          actionUrl: notification.actionUrl,
          data: notification.data,
        });

        // Se a notificação já está lida no servidor, marcar como lida localmente
        if (notification.read) {
          markLocalAsRead(notification.id);
        }
      });

      return data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch notifications";
      setError(errorMessage);

      // Só exibir toast para erros que não sejam de conectividade
      if (err.message !== "Network Error") {
        showToast("error", errorMessage);
      }

      return [];
    } finally {
      setLoading(false);
    }
  }, [user, addNotification, markLocalAsRead, showToast]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return 0;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (err: any) {
      console.error("Failed to fetch unread notification count:", err);
      return 0;
    }
  }, [user]);

  // Mark notification as read (both server and local)
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        setLoading(true);

        // Mark as read on server
        await notificationService.markAsRead(id);

        // Mark as read locally
        markLocalAsRead(id);

        // Update notifications list
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif,
          ),
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to mark notification as read";
        setError(errorMessage);

        // Só exibir toast para erros que não sejam de conectividade
        if (err.message !== "Network Error") {
          showToast("error", errorMessage);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [markLocalAsRead, showToast],
  );

  // Mark all notifications as read (both server and local)
  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);

      // Mark all as read on server
      await notificationService.markAllAsRead();

      // Mark all as read locally
      markAllLocalAsRead();

      // Update all notifications as read
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true })),
      );

      // Reset unread count
      setUnreadCount(0);

      return true;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to mark all notifications as read";
      setError(errorMessage);

      // Só exibir toast para erros que não sejam de conectividade
      if (err.message !== "Network Error") {
        showToast("error", errorMessage);
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [markAllLocalAsRead, showToast]);

  // Delete notification (both server and local)
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        setLoading(true);

        // Delete on server
        await notificationService.deleteNotification(id);

        // Delete locally
        removeNotification(id);

        // Remove from state
        const deletedNotification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));

        // Update unread count if it was unread
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to delete notification";
        setError(errorMessage);

        // Só exibir toast para erros que não sejam de conectividade
        if (err.message !== "Network Error") {
          showToast("error", errorMessage);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [notifications, removeNotification, showToast],
  );

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
        // Add to state
        setNotifications((prev) => [newNotification, ...prev]);

        // Add to local context
        addNotification({
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          actionLabel: newNotification.actionLabel,
          actionUrl: newNotification.actionUrl,
          data: newNotification.data,
        });

        // Update unread count
        setUnreadCount((prev) => prev + 1);
      },
    );

    // Listen for read notifications
    const unsubscribeRead = socketService.on<{ id: string }>(
      socketEvents.notifications.read,
      (data) => {
        // Update in state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === data.id ? { ...notif, read: true } : notif,
          ),
        );

        // Mark as read locally
        markLocalAsRead(data.id);
      },
    );

    // Listen for read all notifications
    const unsubscribeReadAll = socketService.on(
      socketEvents.notifications.readAll,
      () => {
        // Update all as read in state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true })),
        );

        // Mark all as read locally
        markAllLocalAsRead();

        // Reset unread count
        setUnreadCount(0);
      },
    );

    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeReadAll();
    };
  }, [
    user,
    fetchNotifications,
    fetchUnreadCount,
    addNotification,
    markLocalAsRead,
    markAllLocalAsRead,
  ]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
