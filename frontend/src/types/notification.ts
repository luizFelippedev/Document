// frontend/src/types/notification.ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "system" | "message" | "alert" | "success" | "error";
  read: boolean;
  createdAt: string;
  actionLabel?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}
