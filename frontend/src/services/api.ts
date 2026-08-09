import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const getApiUrl = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    let url = String(metaEnv.VITE_API_URL).trim();
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    if (!url.endsWith("/api/v1")) {
      url = `${url}/api/v1`;
    }
    return url;
  }
  const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://${hostname}:8000/api/v1`;
  }
  console.warn("VITE_API_URL environment variable is not set for production deployment. Defaulting to relative /api/v1 path.");
  return "/api/v1";
};

export const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    const isAuthRoute = originalRequest?.url?.includes("/auth/login") || 
                        originalRequest?.url?.includes("/auth/register") ||
                        originalRequest?.url?.includes("/chat/sessions/") ||
                        originalRequest?.url?.includes("/chat/ask");

    // Check if error is 401, request hasn't been retried yet, and isn't a login/register/guest request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        try {
          // Attempt silent token refresh
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          
          // Store new tokens
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
          
          // Retry original request with new header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Silent refresh failed (token expired/invalid), trigger logout
          logger_logout();
        }
      } else {
        logger_logout();
      }
    }
    return Promise.reject(parseApiError(error));
  }
);

function logger_logout() {
  const hadToken = !!localStorage.getItem("access_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  
  const isSharedChat = window.location.pathname.startsWith("/chat/");
  if (hadToken && !isSharedChat && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
    window.location.href = "/login?expired=true";
  }
}

interface ParsedError {
  message: string;
  code: string;
  details: any;
}

export function parseApiError(error: any): ParsedError {
  let message = "An unexpected error occurred. Please try again.";
  let code = "INTERNAL_ERROR";
  let details = null;

  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    message = apiError.message || message;
    code = apiError.code || code;
    details = apiError.details || details;
  } else if (error.message) {
    message = error.message;
  }

  return { message, code, details };
}
