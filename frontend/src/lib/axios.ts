// frontend/src/lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL } from '@/config/constants';
import { getFromStorage, saveToStorage } from '@/utils/storage';

// Função para garantir que não haja duplicação de /api nas URLs
const ensureCorrectUrl = (baseUrl: string, path: string): string => {
  // Se baseUrl termina com /api e path começa com /api
  if (baseUrl.endsWith('/api') && path.startsWith('/api')) {
    return path.substring(4); // Remove o /api do início do path
  }
  return path;
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Função para obter o token de autenticação
const getAuthToken = (): string | null => {
  return getFromStorage('@App:token') || sessionStorage.getItem('@App:token');
};

// Função para salvar o token
const saveAuthToken = (token: string, rememberMe: boolean = false): void => {
  if (rememberMe) {
    saveToStorage('@App:token', token);
  } else {
    sessionStorage.setItem('@App:token', token);
  }
};

// Log da configuração para depuração
console.log('API URL configurada:', API_URL);

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Corrige a URL para evitar duplicação de /api
    if (config.url) {
      config.url = ensureCorrectUrl(API_URL, config.url);
      console.log('URL da requisição:', API_URL + (config.url.startsWith('/') ? config.url : '/' + config.url));
    }

    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle token expiration and refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tenta obter um novo token usando o refresh token
        const refreshToken = getFromStorage('@App:refreshToken') || 
                             sessionStorage.getItem('@App:refreshToken');
        
        if (refreshToken) {
          // Usa o caminho corrigido para evitar duplicação de /api
          const refreshPath = ensureCorrectUrl(API_URL, '/api/auth/refresh');
          const response = await axios.post(`${API_URL}${refreshPath}`, {
            refreshToken
          });
          
          if (response.data.token) {
            // Salva o novo token
            const rememberMe = !!getFromStorage('@App:token');
            saveAuthToken(response.data.token, rememberMe);
            
            // Atualiza o header com o novo token
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            
            // Salva o novo refresh token se fornecido
            if (response.data.refreshToken) {
              if (rememberMe) {
                saveToStorage('@App:refreshToken', response.data.refreshToken);
              } else {
                sessionStorage.setItem('@App:refreshToken', response.data.refreshToken);
              }
            }
            
            // Refaz a requisição original com o novo token
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        
        // Redirecionar para login se não conseguir renovar o token
        if (typeof window !== 'undefined') {
          // Limpar tokens
          localStorage.removeItem('@App:token');
          localStorage.removeItem('@App:refreshToken');
          sessionStorage.removeItem('@App:token');
          sessionStorage.removeItem('@App:refreshToken');
          
          // Você pode implementar um evento ou redirecionar para a página de login
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          // Redirecionar para login (opcional)
          // window.location.href = '/login';
        }
      }
    }

    // Handle offline status
    if (!window.navigator.onLine) {
      // Armazenar requisições para tentar novamente quando estiver online
      const pendingRequests = JSON.parse(
        localStorage.getItem('@App:pendingRequests') || '[]'
      );
      
      pendingRequests.push({
        method: originalRequest.method,
        url: originalRequest.url,
        data: originalRequest.data,
        headers: originalRequest.headers,
        timestamp: new Date().getTime()
      });
      
      localStorage.setItem('@App:pendingRequests', JSON.stringify(pendingRequests));
      
      // Adicionar listener para quando voltar online (uma vez)
      if (!window['__isOnlineListenerSet']) {
        window.addEventListener('online', async () => {
          const requests = JSON.parse(
            localStorage.getItem('@App:pendingRequests') || '[]'
          );
          
          if (requests.length > 0) {
            localStorage.removeItem('@App:pendingRequests');
            
            for (const request of requests) {
              // Reprocessar apenas requisições recentes (< 1 hora)
              if (new Date().getTime() - request.timestamp < 3600000) {
                try {
                  await api.request({
                    method: request.method,
                    url: request.url,
                    data: request.data,
                    headers: request.headers
                  });
                } catch (error) {
                  console.error('Error retrying request:', error);
                }
              }
            }
          }
        });
        
        window['__isOnlineListenerSet'] = true;
      }
      
      return Promise.reject(new Error('Você está offline. A requisição será processada quando estiver online novamente.'));
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Erro de conexão - verifique sua conexão com a internet');
      return Promise.reject(new Error('Falha na conexão com o servidor. Por favor, verifique sua conexão.'));
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Erro no servidor:', error.response?.data);
      return Promise.reject(new Error('Erro no servidor. Por favor, tente novamente mais tarde.'));
    }

    return Promise.reject(error);
  },
);

// Funções utilitárias tipadas para facilitar as chamadas de API

/**
 * Realiza uma requisição GET
 */
export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('GET', url, undefined, config);
}

/**
 * Realiza uma requisição POST
 */
export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('POST', url, data, config);
}

/**
 * Realiza uma requisição PUT
 */
export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('PUT', url, data, config);
}

/**
 * Realiza uma requisição DELETE
 */
export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('DELETE', url, undefined, config);
}

/**
 * Realiza uma requisição PATCH
 */
export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('PATCH', url, data, config);
}

/**
 * Função genérica para realizar requisições HTTP
 */
export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.request({
      method,
      url,
      data,
      ...config,
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Erro na requisição API: ${error.message}`);
    } else {
      console.error(`Erro na requisição API:`, error);
    }
    throw error;
  }
}

/**
 * Faz upload de arquivos
 */
export async function uploadFile<T = unknown>(
  url: string,
  file: File | Blob,
  onProgress?: (percentage: number) => void,
  additionalData?: Record<string, any>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      onProgress(percentCompleted);
    };
  }
  
  return post<T>(url, formData, config);
}

export default {
  api,
  get,
  post,
  put,
  del,
  patch,
  uploadFile,
  apiRequest
};