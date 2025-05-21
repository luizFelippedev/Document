// frontend/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config/constants';
import { getFromStorage } from '@/utils/storage';

type EventCallback<T = any> = (data: T) => void;
type EmitResponse<T = any> = Promise<T>;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<(...args: any[]) => unknown>> = new Map();
  private connected = false;
  private connecting = false;
  private pendingEmits: Array<{ event: string; data?: any; resolve: Function; reject: Function }> = [];
  private connectionPromise: Promise<Socket> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Verificar se o navegador está online ao inicializar
      this.connected = window.navigator.onLine;
      
      // Adicionar listeners para estado de conexão
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Inicializar quando o documento estiver pronto
      if (document.readyState === 'complete') {
        this.initialize();
      } else {
        window.addEventListener('load', () => this.initialize());
      }
    }
  }

  private handleOnline() {
    console.log('Browser is online, reconnecting socket...');
    this.initialize();
  }

  private handleOffline() {
    console.log('Browser is offline, socket will reconnect when online');
    this.connected = false;
  }

  private initialize(): Promise<Socket> {
    if (typeof window === 'undefined') return Promise.reject('Window not available');
    if (this.connecting) return this.connectionPromise!;
    
    this.connecting = true;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      const token = getFromStorage('@App:token') || sessionStorage.getItem('@App:token');
      
      if (!token) {
        this.connecting = false;
        return reject('No authentication token available');
      }
      
      if (this.socket?.connected) {
        this.connecting = false;
        return resolve(this.socket);
      }
      
      // Desconectar socket existente se houver
      if (this.socket) {
        this.socket.disconnect();
      }
      
      // Criar novo socket
      this.socket = io(API_URL, {
        transports: ['websocket'],
        auth: {
          token,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000, // 20 segundos timeout
      });
      
      this.attachListeners(resolve, reject);
    });
    
    return this.connectionPromise;
  }

  private attachListeners(resolve?: Function, reject?: Function) {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.connected = true;
      this.connecting = false;
      
      // Processar emits pendentes
      this.processPendingEmits();
      
      // Re-anexar event handlers
      this.reattachEventHandlers();
      
      if (resolve) resolve(this.socket);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.connecting = false;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached, giving up');
        if (reject) reject(error);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.connected = false;
      
      if (reason === 'io server disconnect') {
        // Desconexão forçada pelo servidor
        this.reconnect();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.connecting = false;
      if (reject) reject(error);
    });
    
    // Lidar com eventos do sistema
    this.socket.on(socketEvents.system.update, (data) => {
      console.log('System update received:', data);
      // Disparar evento global para atualização do sistema
      window.dispatchEvent(new CustomEvent('system:update', { detail: data }));
    });
    
    this.socket.on(socketEvents.system.maintenance, (data) => {
      console.log('System maintenance notification:', data);
      // Disparar evento global
      window.dispatchEvent(new CustomEvent('system:maintenance', { detail: data }));
    });
  }

  private reconnect() {
    if (!this.socket || this.connecting) return;
    
    this.connecting = true;
    
    // Usar backoff exponencial para atrasos de reconexão
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts));
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      console.log('Reconnecting...');
      this.initialize().catch(error => {
        console.error('Reconnection failed:', error);
        this.connecting = false;
      });
    }, delay);
  }

  private reattachEventHandlers() {
    if (!this.socket) return;
    
    // Limpar quaisquer listeners duplicados
    this.eventHandlers.forEach((handlers, event) => {
      this.socket?.off(event);
      
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });
  }

  private processPendingEmits() {
    if (this.pendingEmits.length === 0) return;
    
    console.log(`Processing ${this.pendingEmits.length} pending emits`);
    
    // Fazer uma cópia para evitar problemas se novos emits forem adicionados durante o processamento
    const pendingEmits = [...this.pendingEmits];
    this.pendingEmits = [];
    
    pendingEmits.forEach(({ event, data, resolve, reject }) => {
      this.emitWithAck(event, data)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Assinar um evento socket
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.socket) {
      this.initialize().catch(console.error);
    }
    
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(callback as any);
    
    this.socket?.on(event, callback as any);
    
    // Retornar função para cancelar assinatura
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Cancelar assinatura de um evento
   */
  off(event: string, callback?: (...args: any[]) => unknown): void {
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

  /**
   * Emitir um evento sem esperar resposta
   */
  emit<T = unknown>(event: string, data?: T): boolean {
    if (!this.socket) {
      this.initialize().catch(console.error);
    }
    
    if (!this.socket?.connected) {
      console.warn(`Socket not connected. Emitting ${event} when connected.`);
      this.socket?.once('connect', () => {
        this.socket?.emit(event, data);
      });
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Emitir um evento e esperar por uma resposta (com timeout)
   */
  emitWithAck<T = unknown, R = unknown>(
    event: string, 
    data?: T, 
    timeout: number = 10000
  ): EmitResponse<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.initialize()
          .then(() => this.emitAndWaitForResponse(event, data, timeout, resolve, reject))
          .catch(error => reject(error));
        return;
      }
      
      if (!this.socket.connected) {
        // Armazenar o emit para processamento posterior quando conectado
        this.pendingEmits.push({ event, data, resolve, reject });
        
        // Tentar conectar
        this.initialize().catch(error => reject(error));
        return;
      }
      
      this.emitAndWaitForResponse(event, data, timeout, resolve, reject);
    });
  }

  private emitAndWaitForResponse<T, R>(
    event: string,
    data: T | undefined,
    timeout: number,
    resolve: (value: R) => void,
    reject: (reason?: any) => void
  ) {
    // Verificar se o socket está disponível
    if (!this.socket) {
      return reject(new Error('Socket not initialized'));
    }
    
    // Criar um timeout para rejeitar a promessa se não houver resposta
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${event}`));
    }, timeout);
    
    // Emitir o evento e esperar pela resposta
    this.socket.emit(event, data, (error: Error | null, response: R) => {
      clearTimeout(timeoutId);
      
      if (error) {
        return reject(error);
      }
      
      resolve(response);
    });
  }

  /**
   * Verificar se o socket está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Desconectar o socket
   */
  disconnect(): void {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.eventHandlers.clear();
    this.pendingEmits = [];
    this.connected = false;
    this.connecting = false;
    this.connectionPromise = null;
  }

  /**
   * Reconectar com novo token
   */
  reconnectWithToken(token: string): Promise<Socket> {
    this.disconnect();
    
    // Redefinir tentativas de reconexão
    this.reconnectAttempts = 0;
    
    // Armazenar o token (não é responsabilidade deste serviço, mas ajuda no desenvolvimento)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('@App:token', token);
    }
    
    // Inicializar conexão com novo token
    return this.initialize();
  }

  /**
   * Obter o ID do socket atual
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Assinar uma vez para um evento
   */
  once<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!this.socket) {
      this.initialize().catch(console.error);
    }
    
    this.socket?.once(event, callback as any);
  }
  
  /**
   * Verificar se o servidor está respondendo (ping)
   */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        return reject(new Error('Socket not connected'));
      }
      
      const start = Date.now();
      
      this.socket.emit('ping', null, () => {
        const duration = Date.now() - start;
        resolve(duration);
      });
      
      // Timeout após 5 segundos
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }
}

// Criar instância singleton
export const socketService = new SocketService();

// Tipos e constantes de eventos
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

// Hooks para React
export function useSocket() {
  return {
    socket: socketService,
    events: socketEvents,
    isConnected: socketService.isConnected(),
    
    // Métodos do socket
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    emit: socketService.emit.bind(socketService),
    emitWithAck: socketService.emitWithAck.bind(socketService),
    disconnect: socketService.disconnect.bind(socketService),
    reconnectWithToken: socketService.reconnectWithToken.bind(socketService),
  };
}

export default socketService;