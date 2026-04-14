// API Client with Axios
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiError } from '../types';

// API Base URL (will be configured via environment variables)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle errors
    if (error.response) {
      const status = error.response.status;
      const apiError = error.response.data;

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${status}:`, apiError);
      }

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.error('Authentication failed. Logging out...');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden. Insufficient permissions.');
          break;

        case 404:
          // Not found
          console.error('Resource not found.');
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error. Please try again later.');
          break;

        default:
          console.error('API error:', apiError.message || 'Unknown error');
      }

      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('Network error. Please check your connection.');
      return Promise.reject({
        statusCode: 0,
        message: 'Network error. Please check your internet connection.',
        timestamp: new Date().toISOString(),
      } as ApiError);
    } else {
      // Something else happened
      console.error('Request error:', error.message);
      return Promise.reject({
        statusCode: 0,
        message: error.message || 'An unexpected error occurred.',
        timestamp: new Date().toISOString(),
      } as ApiError);
    }
  }
);

// Utility function to set auth token
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Utility function to remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Utility function to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export default apiClient;
