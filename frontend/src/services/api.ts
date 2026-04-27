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
    // Check if window.env exists and has a valid URL (not the placeholder string)
    const runtimeUrl = window.env?.VITE_API_URL;
    const isValidRuntimeUrl = runtimeUrl && runtimeUrl !== "${VITE_API_URL}";
    
    const apiUrl = isValidRuntimeUrl 
      ? runtimeUrl 
      : import.meta.env.VITE_API_URL || "http://localhost:3000";
    
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
      (response: AxiosResponse) => {
        // Validate JSON response
        const contentType = response.headers["content-type"];
        if (contentType && !contentType.includes("application/json")) {
          console.error("Non-JSON response received:", contentType);
          return Promise.reject({
            message: "Mã phản hồi không hợp lệ (không phải JSON)",
            statusCode: response.status,
          });
        }
        return response;
      },
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
      if (typeof error.response.data === 'string' && (error.response.data.startsWith('<!doctype') || error.response.data.startsWith('<html'))) {
          return {
            message: "Máy chủ trả về HTML thay vì JSON. Có thể route API chưa đúng.",
            statusCode: error.response.status || 500,
          };
      }
      return error.response.data as ApiError;
    }

    return {
      message: error.message || "Đã xảy ra lỗi không xác định",
      statusCode: error.response?.status || 500,
    };
  }

  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
