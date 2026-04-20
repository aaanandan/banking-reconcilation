/**
 * API Client
 *
 * Axios-based HTTP client with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, getRefreshToken, clearAuthData, storeTokens } from '../utils/authUtils';
import type { ApiResponse, ApiError } from './types';

// ==================== CONFIGURATION ====================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// ==================== CREATE AXIOS INSTANCE ====================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== REQUEST INTERCEPTOR ====================

apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID if available
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.tenantId) {
          config.headers['X-Tenant-ID'] = userData.tenantId;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the response data directly
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

          // Store new tokens
          storeTokens(
            {
              accessToken,
              refreshToken: newRefreshToken,
              expiresIn,
            },
            true
          );

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth data and redirect to login
        clearAuthData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(createApiError(error));
  }
);

// ==================== ERROR HANDLING ====================

/**
 * Create standardized API error from axios error
 */
function createApiError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with error
    const data = error.response.data as any;

    return {
      message: data?.message || 'An error occurred',
      code: data?.code || 'UNKNOWN_ERROR',
      status: error.response.status,
      errors: data?.errors,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'CLIENT_ERROR',
      status: 0,
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Upload file with progress tracking
 */
export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<AxiosResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  url: string,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<AxiosResponse> {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });

  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
}

/**
 * Download file
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });

  // Create blob link to download
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
}

// ==================== API WRAPPER ====================

/**
 * Wrapped API methods with type safety
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then((res) => res.data),
};

export default apiClient;
