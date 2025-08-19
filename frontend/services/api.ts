import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api/v1" // Dev
  : "https://i'll-add-this-later/api/v1"; // Prod

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.headers["X-Retry"]
        ) {
          try {
            await this.refreshToken();
            originalRequest.headers["X-Retry"] = "true";
            return this.api(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting access token:", error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting refresh token:", error);
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(newRefreshToken);
  }

  async login(email: string, password: string) {
    const response = await this.api.post("/auth/login", { email, password });
    const { accessToken, refreshToken } = response.data.data;

    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);

    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.api.post("/auth/register", userData);
    return response.data;
  }

  async logout() {
    const refreshToken = await this.getRefreshToken();
    try {
      await this.api.post("/auth/logout", { refreshToken });
    } finally {
      await this.clearTokens();
    }
  }

  async getProfile() {
    const response = await this.api.get("/auth/profile");
    return response.data;
  }

  async getPosts(params?: {
    page?: number;
    limit?: number;
    postType?: string;
    city?: string;
    state?: string;
  }) {
    const response = await this.api.get("/posts", { params });
    return response.data;
  }

  async createPost(postData: {
    title?: string;
    content: string;
    postType: string;
    priority?: string;
    isEmergency?: boolean;
    images?: string[];
    tags?: string[];
  }) {
    const response = await this.api.post("/posts", postData);
    return response.data;
  }

  async getPost(postId: number) {
    const response = await this.api.get(`/posts/${postId}`);
    return response.data;
  }

  async getCurrentWeather(lat: number, lng: number) {
    const response = await this.api.get("/weather/current", {
      params: { lat, lng },
    });
    return response.data;
  }

  async getAlerts(params?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  }) {
    const response = await this.api.get("/alerts", { params });
    return response.data;
  }

  async searchPosts(query: string, filters?: any) {
    const response = await this.api.get("/search", {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  async healthCheck() {
    const response = await axios.get(
      `${API_BASE_URL.replace("/api/v1", "")}/health`
    );
    return response.data;
  }

  getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService;
