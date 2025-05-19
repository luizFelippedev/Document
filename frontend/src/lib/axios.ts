import axios from "axios"; const axiosInstance = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, headers: { "Content-Type": "application/json" }, withCredentials: true }); axiosInstance.interceptors.request.use((config) => { const token = localStorage.getItem("token"); if (token) { config.headers.Authorization = `Bearer ${token}`; } return config; }); axiosInstance.interceptors.response.use((response) => response, async (error) => { if (error.response && error.response.status === 401) { localStorage.removeItem("token"); window.location.href = "/auth/login"; } return Promise.reject(error); }); export default axiosInstance;
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@App:token');
      window.location.href = '/auth/login';
    }

    const message = error.response?.data?.message || 'Ocorreu um erro inesperado';
    toast.error(message);

    return Promise.reject(error);
  }
);