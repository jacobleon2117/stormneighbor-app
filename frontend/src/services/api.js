import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseURL = () => {
  if (__DEV__) {
    // For development
    return "http://192.168.1.89:3000";
  } else {
    // Production URL
    return "https://your-production-backend.com";
  }
};

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: getBaseURL(),
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem("authToken");
        }
        return Promise.reject(error);
      }
    );
  }

  async testConnection() {
    try {
      const response = await this.api.get("/health");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data || "Network error",
      };
    }
  }

  async login(email, password) {
    try {
      const response = await this.api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post("/api/auth/register", userData);

      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getProfile() {
    try {
      const response = await this.api.get("/api/auth/profile");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.api.put("/api/auth/profile", profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async forgotPassword(email) {
    try {
      const response = await this.api.post("/api/auth/forgot-password", {
        email,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyCode(email, code) {
    try {
      const response = await this.api.post("/api/auth/verify-code", {
        email,
        code,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async resetPassword(email, code, newPassword) {
    try {
      const response = await this.api.post("/api/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async checkEmailVerification() {
    try {
      const response = await this.api.get("/api/auth/verify-status");
      return { success: true, verified: response.data.verified };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async resendVerificationEmail() {
    try {
      const response = await this.api.post("/api/auth/resend-verification");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async resendVerificationCode(email) {
    try {
      const response = await this.api.post("/api/auth/resend-code", { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getNearbyNeighborhoods(latitude, longitude, radius = 5) {
    try {
      const response = await this.api.get("/api/neighborhoods/nearby", {
        params: { latitude, longitude, radius },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getNeighborhood(id) {
    try {
      const response = await this.api.get(`/api/neighborhoods/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async createNeighborhood(neighborhoodData) {
    try {
      const response = await this.api.post(
        "/api/neighborhoods",
        neighborhoodData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getPosts(neighborhoodId, filters = {}) {
    try {
      const params = { neighborhoodId, ...filters };
      const response = await this.api.get("/api/posts", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async createPost(postData) {
    try {
      const response = await this.api.post("/api/posts", postData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getPost(postId) {
    try {
      const response = await this.api.get(`/api/posts/${postId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async updatePost(postId, postData) {
    try {
      const response = await this.api.put(`/api/posts/${postId}`, postData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async deletePost(postId) {
    try {
      const response = await this.api.delete(`/api/posts/${postId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getComments(postId) {
    try {
      const response = await this.api.get(`/api/posts/${postId}/comments`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async createComment(postId, commentData) {
    try {
      const response = await this.api.post(
        `/api/posts/${postId}/comments`,
        commentData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async addReaction(postId, reactionType) {
    try {
      const response = await this.api.post(`/api/posts/${postId}/reactions`, {
        reactionType,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async removeReaction(postId) {
    try {
      const response = await this.api.delete(`/api/posts/${postId}/reactions`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getCurrentWeather(latitude, longitude) {
    try {
      const response = await this.api.get("/api/weather/current", {
        params: { lat: latitude, lng: longitude },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getAlerts(neighborhoodId) {
    try {
      const response = await this.api.get("/api/alerts", {
        params: { neighborhoodId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async createAlert(alertData) {
    try {
      const response = await this.api.post("/api/alerts", alertData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getNotifications() {
    try {
      const response = await this.api.get("/api/notifications");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await this.api.put(
        `/api/notifications/${notificationId}/read`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async updateNotificationPreferences(preferences) {
    try {
      const response = await this.api.put(
        "/api/auth/notification-preferences",
        preferences
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

export default new ApiService();
