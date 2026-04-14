// Authentication Service
import apiClient, { setAuthToken, removeAuthToken } from './api';
import { jwtDecode } from 'jwt-decode';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  JwtPayload,
} from '../types';

const AUTH_SERVICE_PORT = import.meta.env.VITE_AUTH_SERVICE_PORT || '3004';
const AUTH_BASE_URL = `http://localhost:${AUTH_SERVICE_PORT}/auth`;

export const authService = {
  /**
   * Register a new tenant and admin user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(`${AUTH_BASE_URL}/register`, data);

    if (response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${AUTH_BASE_URL}/login`, data);

    if (response.data.token) {
      setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * Logout - clear tokens and user data
   */
  logout() {
    removeAuthToken();
    window.location.href = '/login';
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Decode JWT token and extract payload
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      // exp is in seconds, Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    return !this.isTokenExpired(token);
  },

  /**
   * Get tenant context from JWT token
   */
  getTenantContext(): { tenantId: string; userId: string; role: string } | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return {
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      role: decoded.role,
    };
  },
};

export default authService;
