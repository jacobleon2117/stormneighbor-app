import axios, { AxiosInstance, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../constants/config";
import { NotificationPreferences, SearchFilters } from "../types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
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

    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(newRefreshToken);
  }

  async login(email: string, password: string) {
    try {
      console.log("Attempting login for:", email);
      console.log("API Base URL:", API_CONFIG.BASE_URL);

      const response = await this.api.post("/auth/login", { email, password });
      console.log("Login response received");

      const { accessToken, refreshToken } = response.data.data;

      await this.setAccessToken(accessToken);
      await this.setRefreshToken(refreshToken);

      console.log("Login successful, tokens saved");
      return response.data;
    } catch (error) {
      console.error("Login error in API service:", error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    try {
      console.log("Attempting registration with:", {
        ...userData,
        password: "[HIDDEN]",
      });
      console.log("API Base URL:", API_CONFIG.BASE_URL);

      const response = await this.api.post("/auth/register", userData);
      console.log("Registration successful");
      return response.data;
    } catch (error) {
      console.error("Registration error in API service:", error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await this.api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Forgot password error in API service:", error);
      throw error;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    try {
      const response = await this.api.post("/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error in API service:", error);
      throw error;
    }
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

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    locationCity?: string;
    addressState?: string;
    zipCode?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    homeCity?: string | null;
    homeState?: string | null;
    homeZipCode?: string | null;
    homeAddress?: string | null;
    homeLatitude?: number;
    homeLongitude?: number;
    locationRadiusMiles?: number;
    showCityOnly?: boolean;
    notificationPreferences?: NotificationPreferences;
    locationPreferences?: any;
    locationPermissions?: any;
  }) {
    const backendData = {
      ...profileData,
      city: profileData.locationCity,
      state: profileData.addressState,
    };

    delete backendData.locationCity;
    delete backendData.addressState;

    const response = await this.api.put("/auth/profile", backendData);
    return response.data;
  }

  async updateNotificationPreferences(notificationPreferences: NotificationPreferences) {
    try {
      const response = await this.api.put("/auth/notification-preferences", {
        notificationPreferences,
      });
      return response.data;
    } catch (error) {
      console.error("Update notification preferences error in API service:", error);
      throw error;
    }
  }

  async registerPushToken(pushToken: string) {
    try {
      const response = await this.api.post("/notifications/register-push-token", {
        pushToken,
      });
      return response.data;
    } catch (error) {
      console.error("Register push token error in API service:", error);
      throw error;
    }
  }

  async getPosts(params?: {
    page?: number;
    limit?: number;
    postType?: string;
    city?: string;
    state?: string;
  }) {
    const response = await this.api.get("/posts", { params });

    if (response.data.success && response.data.data?.posts) {
      const transformedPosts = response.data.data.posts.map((post: any) => ({
        ...post,
        firstName: post.user?.firstName,
        lastName: post.user?.lastName,
        profileImageUrl: post.user?.profileImageUrl,
        userId: post.user?.id || post.userId,
        user: post.user,
      }));

      return {
        ...response.data,
        data: {
          ...response.data.data,
          posts: transformedPosts,
        },
      };
    }

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

  async getAlert(alertId: number) {
    const response = await this.api.get(`/alerts/${alertId}`);
    return response.data;
  }

  async createAlert(alertData: {
    title: string;
    description: string;
    alertType: string;
    severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    startTime?: string;
    endTime?: string;
  }) {
    const response = await this.api.post("/alerts", alertData);
    return response.data;
  }

  async searchPosts(query: string, filters?: SearchFilters) {
    const response = await this.api.get("/search", {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  async getComments(
    postId: number,
    params?: {
      page?: number;
      limit?: number;
      parentId?: number;
    }
  ) {
    const response = await this.api.get(`/posts/${postId}/comments`, {
      params,
    });
    return response.data;
  }

  async createComment(
    postId: number,
    commentData: {
      content: string;
      parentCommentId?: number;
      images?: string[];
    }
  ) {
    const response = await this.api.post(`/posts/${postId}/comments`, commentData);
    return response.data;
  }

  async updateComment(commentId: number, content: string) {
    const response = await this.api.put(`/comments/${commentId}`, { content });
    return response.data;
  }

  async deleteComment(commentId: number) {
    const response = await this.api.delete(`/comments/${commentId}`);
    return response.data;
  }

  async toggleCommentReaction(commentId: number, reactionType: string = "like") {
    const response = await this.api.post(`/comments/${commentId}/reactions`, {
      reactionType,
    });
    return response.data;
  }

  async removeCommentReaction(commentId: number) {
    const response = await this.api.delete(`/comments/${commentId}/reactions`);
    return response.data;
  }

  async reportComment(commentId: number, reason: string, details?: string) {
    const response = await this.api.post(`/comments/${commentId}/report`, {
      reason,
      details,
    });
    return response.data;
  }

  async togglePostReaction(postId: number, reactionType: string = "like") {
    const response = await this.api.post(`/posts/${postId}/reactions`, {
      reactionType,
    });
    return response.data;
  }

  async removePostReaction(postId: number) {
    const response = await this.api.delete(`/posts/${postId}/reactions`);
    return response.data;
  }

  async sharePost(postId: number) {
    const response = await this.api.get(`/posts/${postId}`);
    return response.data;
  }

  async reportPost(postId: number, reason: string, description?: string) {
    const response = await this.api.post(`/posts/${postId}/report`, {
      reason,
      description,
    });
    return response.data;
  }

  async getConversations(params?: { page?: number; limit?: number }) {
    const response = await this.api.get("/messages/conversations", { params });
    return response.data;
  }

  async createConversation(recipientId: number, initialMessage: string) {
    const response = await this.api.post("/messages/conversations", {
      recipientId,
      initialMessage,
    });
    return response.data;
  }

  async getMessages(
    conversationId: number,
    params?: {
      page?: number;
      limit?: number;
    }
  ) {
    const response = await this.api.get(`/messages/conversations/${conversationId}/messages`, {
      params,
    });
    return response.data;
  }

  async sendMessage(
    conversationId: number,
    messageData: {
      content: string;
      messageType?: string;
      images?: string[];
    }
  ) {
    const response = await this.api.post(
      `/messages/conversations/${conversationId}/messages`,
      messageData
    );
    return response.data;
  }

  async markMessageAsRead(messageId: number) {
    const response = await this.api.put(`/messages/messages/${messageId}/read`);
    return response.data;
  }

  async getUnreadMessageCount() {
    const response = await this.api.get("/messages/unread-count");
    return response.data;
  }

  async uploadImage(imageUri: string, type: "profile" | "post" | "comment" = "post") {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "image.jpg",
    } as any);

    const endpoint =
      type === "profile"
        ? "/upload/profile-image"
        : type === "comment"
          ? "/upload/comment-image"
          : "/upload/post-image";

    const response = await this.api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const response = await this.api.get("/notifications", { params });
    return response.data;
  }

  async markNotificationAsRead(notificationId: number) {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put("/notifications/read-all");
    return response.data;
  }

  async deleteNotification(notificationId: number) {
    const response = await this.api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async getNotificationSettings() {
    const response = await this.api.get("/notifications/settings");
    return response.data;
  }

  async submitUserFeedback(feedbackData: any) {
    const response = await this.api.post("/feedback", feedbackData);
    return response.data;
  }

  async healthCheck() {
    const response = await axios.get(`${API_CONFIG.BASE_URL.replace("/api/v1", "")}/health`);
    return response.data;
  }

  getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService;
