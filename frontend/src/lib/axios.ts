// frontend/src/lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_URL } from "@/config/constants";
import { getFromStorage } from "@/utils/storage";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token =
      getFromStorage("@App:token") || sessionStorage.getItem("@App:token");
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
      // Implement token refresh logic here
      // originalRequest._retry = true;
      // Try refreshing token and retrying the request
    }

    // Handle offline status
    if (!window.navigator.onLine) {
      // Handle offline scenario
      // Store failed requests for retry when back online
    }

    // Handle network errors
    if (error.message === "Network Error") {
      console.error("Network error - check internet connection");
    }

    return Promise.reject(error);
  },
);

// Generic request function with types
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
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
    console.error(`API Request Error: ${error}`);
    throw error;
  }
}
