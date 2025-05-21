// frontend/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config/constants';
import { getFromStorage } from '@/utils/storage';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    if (typeof window === 'undefined') return;
    
    const token = getFromStorage('@App:token') || sessionStorage.getItem('@App:token');
    
    if (!token) return;
    
    this.socket = io(API_URL, {
      transports: ['websocket'],
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });
    
    this.attachListeners();
  }
  
  private attachListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // The server has forced the disconnection
        this.reconnect();
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  
  private reconnect() {
    if (!this.socket) return;
    
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.socket?.connect();
    }, this.reconnectDelay);
  }
  
  on<T = any>(event: string, callback: (data: T) => void) {
    if (!this.socket) {
      this.initialize();
    }
    
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(callback);
    
    this.socket?.on(event, callback);
    
    // Return an unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }
  
  off(event: string, callback?: Function) {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback as any);
      
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    } else {
      this.socket.off(event);
      this.eventHandlers.delete(event);
    }
  }
  
  emit<T = any>(event: string, data?: T) {
    if (!this.socket) {
      this.initialize();
    }
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Buffering event...');
      this.socket?.on('connect', () => {
        this.socket?.emit(event, data);
      });
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }
  
  isConnected() {
    return this.socket?.connected || false;
  }
  
  disconnect() {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.eventHandlers.clear();
  }
  
  reconnectWithToken(token: string) {
    this.disconnect();
    
    this.socket = io(API_URL, {
      transports: ['websocket'],
      auth: {
        token
      }
    });
    
    this.attachListeners();
    
    // Re-attach event handlers
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket?.on(event, handler as any);
      });
    });
  }
}

export const socketService = new SocketService();

// Type-safe event listeners
export const socketEvents = {
  notifications: {
    new: 'notification:new',
    read: 'notification:read',
    readAll: 'notification:readAll',
  },
  projects: {
    created: 'project:created',
    updated: 'project:updated',
    deleted: 'project:deleted',
  },
  certificates: {
    created: 'certificate:created',
    updated: 'certificate:updated',
    deleted: 'certificate:deleted',
    verified: 'certificate:verified',
  },
  users: {
    online: 'user:online',
    offline: 'user:offline',
    typing: 'user:typing',
  },
  chat: {
    message: 'chat:message',
    typing: 'chat:typing',
    read: 'chat:read',
  },
  system: {
    update: 'system:update',
    maintenance: 'system:maintenance',
  },
};