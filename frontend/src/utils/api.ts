// src/utils/api.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import {
  debounce,
  throttle,
  formatQueryParams,
  getErrorMessage,
  createCancelableRequest,
} from './helpers';

// Types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

export interface RequestParams {
  [key: string]: unknown;
}

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
};

// Cache for API instances
const instanceCache = new Map<string, AxiosInstance>();

/**
 * Creates an API instance with the given configuration
 */
export function createApiInstance(
  config: ApiConfig = DEFAULT_CONFIG,
): AxiosInstance {
  // Create a cache key from the config
  const cacheKey = JSON.stringify(config);

  // Check if we already have an instance with this config
  if (instanceCache.has(cacheKey)) {
    return instanceCache.get(cacheKey)!;
  }

  // Create a new instance
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: config.headers,
    withCredentials: config.withCredentials,
  });

  // Request interceptor for auth token
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        // Redirect to login or refresh token
        if (typeof window !== 'undefined') {
          // Refresh token or redirect to login
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            return refreshAuthToken(refreshToken)
              .then((newToken) => {
                setAuthToken(newToken);
                // Retry the original request
                if (error.config) {
                  error.config.headers.Authorization = `Bearer ${newToken}`;
                  return axios(error.config);
                }
                return Promise.reject(error);
              })
              .catch(() => {
                // If refresh failed, clear tokens and redirect to login
                clearAuthTokens();
                redirectToLogin();
                return Promise.reject(error);
              });
          } else {
            // No refresh token, redirect to login
            clearAuthTokens();
            redirectToLogin();
          }
        }
      }

      // Transform error to standardized format
      const apiError: ApiError = {
        message:
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred',
        status: error.response?.status || 500,
        code: error.response?.data?.code,
        errors: error.response?.data?.errors,
        timestamp: error.response?.data?.timestamp,
        path: error.response?.data?.path,
      };

      return Promise.reject(apiError);
    },
  );

  // Cache the instance
  instanceCache.set(cacheKey, instance);

  return instance;
}

// Default API instance
export const api = createApiInstance();

/**
 * Make a GET request
 */
export async function get<T = unknown>(
  url: string,
  params?: RequestParams,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<T>(url, { params, ...config });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Make a POST request
 */
export async function post<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Make a PUT request
 */
export async function put<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Make a PATCH request
 */
export async function patch<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await api.patch<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Make a DELETE request
 */
export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get a paginated response
 */
export async function getPaginated<T = unknown>(
  url: string,
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, unknown>,
  sort?: { field: string; direction: 'asc' | 'desc' },
  search?: string,
): Promise<PaginatedResponse<T>> {
  const params: RequestParams = {
    page,
    limit, // Padronizado para usar 'limit' em vez de 'itemsPerPage'
    ...filters,
  };

  if (sort) {
    params.sortField = sort.field;
    params.sortDirection = sort.direction;
  }

  if (search) {
    params.search = search;
  }

  const response = await get<PaginatedResponse<T>>(url, params);
  return response.data;
}

/**
 * Upload a file
 */
export async function uploadFile<T = unknown>(
  url: string,
  file: File,
  onProgress?: (percentage: number) => void,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);

  const uploadConfig: AxiosRequestConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
  };

  return post<T, FormData>(url, formData, uploadConfig);
}

/**
 * Upload multiple files
 */
export async function uploadFiles<T = unknown>(
  url: string,
  files: File[],
  fieldName: string = 'files',
  onProgress?: (percentage: number) => void,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append(`${fieldName}[${index}]`, file);
  });

  const uploadConfig: AxiosRequestConfig = {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
  };

  return post<T, FormData>(url, formData, uploadConfig);
}

/**
 * Download a file
 */
export async function downloadFile(
  url: string,
  filename?: string,
  params?: RequestParams,
  config?: AxiosRequestConfig,
): Promise<void> {
  try {
    const response = await api.get(url, {
      ...config,
      params,
      responseType: 'blob',
    });

    // Get the filename from the Content-Disposition header or use the provided filename
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;

    if (!downloadFilename && contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create a download link and trigger the download
    const blob = new Blob([response.data], {
      type: response.headers['content-type'],
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadFilename || 'download');
    document.body.appendChild(link);
    link.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    throw error;
  }
}

/* Auth token management */

/**
 * Get the auth token from storage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Get the refresh token from storage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

/**
 * Set the auth token in storage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Set the refresh token in storage
 */
export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', token);
  }
}

/**
 * Clear auth tokens from storage
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Refresh the auth token using the refresh token
 */
async function refreshAuthToken(refreshToken: string): Promise<string> {
  try {
    const response = await api.post<{ token: string; refresh_token: string }>(
      '/auth/refresh',
      { refresh_token: refreshToken },
    );

    // Update the refresh token if a new one is provided
    if (response.data.refresh_token) {
      setRefreshToken(response.data.refresh_token);
    }

    return response.data.token;
  } catch (error) {
    throw error;
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    // Save the current URL to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login' && currentPath !== '/auth/login') {
      localStorage.setItem('auth_redirect', currentPath);
    }

    // Redirect to login
    window.location.href = '/login';
  }
}

// Export debounce and throttle for convenience
export {
  debounce,
  throttle,
  formatQueryParams,
  getErrorMessage,
  createCancelableRequest,
};

// Export the default instance
export default api;
