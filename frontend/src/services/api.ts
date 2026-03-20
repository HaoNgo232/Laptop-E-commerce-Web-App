// Base API configuration
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";
import { LoginResponse } from "@/types";
import { authService } from "@/services/authService";

// Extend Window interface for runtime env
declare global {
  interface Window {
    env?: {
      VITE_API_URL?: string;
    };
  }
}

class ApiClient {
  private readonly client: AxiosInstance;
  private refreshTokenPromise: Promise<LoginResponse> | null = null;

  constructor() {
    // Priority: window.env (runtime) > import.meta.env (build-time) > fallback
    const apiUrl = window.env?.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: attach token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401: token expired, but ignore for login/register
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.endsWith("/login") &&
          !originalRequest.url?.endsWith("/register")
        ) {
          originalRequest._retry = true;

          if (!this.refreshTokenPromise) {
            this.refreshTokenPromise = authService.refreshToken();
          }

          try {
            const { accessToken } = await this.refreshTokenPromise;

            if (originalRequest.headers) {
              originalRequest.headers[
                "Authorization"
              ] = `Bearer ${accessToken}`;
            }
            return await this.client(originalRequest);
          } catch (refreshError) {
            console.error("Token hết hạn, đang logout...");
            // Logout khi refresh thất bại
            authService.logout();
            return Promise.reject(
              this.transformError(refreshError as AxiosError),
            );
          } finally {
            this.refreshTokenPromise = null;
          }
        }
        return Promise.reject(this.transformError(error));
      },
    );
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError;
    }

    return {
      message: error.message || "Đã xảy ra lỗi không xác định",
      statusCode: error.response?.status || 500,
    };
  }

  async get<T>(url: string, params?: object): Promise<T> {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }

  async post<T>(url: string, data?: object): Promise<T> {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }

  async put<T>(url: string, data?: object): Promise<T> {
    try {
      const response = await this.client.put(url, data);
      return response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }

  async patch<T>(url: string, data?: object): Promise<T> {
    try {
      const response = await this.client.patch(url, data);
      return response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete(url);
      return response.data;
    } catch (error) {
      throw this.transformError(error as AxiosError);
    }
  }
}

export const apiClient = new ApiClient();
