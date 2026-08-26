import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Extract clean error messages & handle 401 authentication
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized handling
    if (error.response && error.response.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      // Only redirect if not already on login/register pages
      if (
        hadToken &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login?expired=true';
      }
    }

    // Attach parsed user-friendly message directly to the error object
    if (error) {
      error.userMessage = getErrorMessage(error);
    }

    return Promise.reject(error);
  }
);

export default api;
