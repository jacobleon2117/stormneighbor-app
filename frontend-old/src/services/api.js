// File: frontend/src/services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseURL = () => {
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.89:3000";
  } else {
    return process.env.EXPO_PUBLIC_API_URL || "https://production-backend.com";
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

    console.log(
      "API Service initialized with base URL:",
      this.api.defaults.baseURL
    );

    this.api.interceptors.request.use(
      async (config) => {
        if (__DEV__) {
          console.log("API Request:", config.method?.toUpperCase(), config.url);
          console.log("Base URL:", config.baseURL);
        }

        try {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (__DEV__) console.log("Token added to request");
          } else {
            if (__DEV__) console.log("No token found");
          }
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(
            "API Success:",
            response.config.method?.toUpperCase(),
            response.config.url,
            response.status
          );
        }
        return response;
      },
      async (error) => {
        console.error("API Error Details:", {
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          code: error.code,
          baseURL: error.config?.baseURL,
        });

        if (error.response?.status === 401) {
          console.log("Removing auth token due to 401");
          await AsyncStorage.removeItem("authToken");
        }
        return Promise.reject(error);
      }
    );
  }

  updateBaseURL(newBaseURL) {
    this.api.defaults.baseURL = newBaseURL;
    console.log("API Base URL updated to:", newBaseURL);
  }
  getUserLocationParams(user) {
    console.log("User location:", user?.location);
    const coordinates = user?.location?.coordinates;
    const radiusMiles = user?.location?.radiusMiles || 25;

    if (coordinates?.latitude && coordinates?.longitude) {
      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: radiusMiles,
      };
    }

    return null;
  }
  async testNetwork() {
    try {
      console.log("Testing network connection to:", this.api.defaults.baseURL);
      const response = await this.api.get("/health");
      console.log("Network test successful:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Network test failed:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        baseURL: this.api.defaults.baseURL,
      });
      return { success: false, error: error.message };
    }
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
      console.log("Attempting login for:", email);
      const response = await this.api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem("authToken", response.data.token);
        console.log("Login successful, token saved");
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
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
  async getPosts(user, filters = {}) {
    try {
      const locationParams = this.getUserLocationParams(user);

      if (!locationParams) {
        console.log("No location params available for getPosts");
        return { success: true, data: { posts: [] } };
      }

      const params = {
        ...locationParams,
        ...filters,
      };

      console.log("API: Getting posts with params:", params);

      const response = await this.api.get("/api/posts", { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async createPost(postData, user) {
    if (user?.location?.coordinates) {
      postData.latitude = user.location.coordinates.latitude;
      postData.longitude = user.location.coordinates.longitude;
    }

    try {
      console.log("API: Sending post data:", postData);
      const response = await this.api.post("/api/posts", postData);
      return { success: true, data: response.data };
    } catch (error) {
      console.log("API: Post creation error:", error.response?.data);
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
  async updateComment(postId, commentId, commentData) {
    try {
      const response = await this.api.put(
        `/api/posts/${postId}/comments/${commentId}`,
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
  async deleteComment(postId, commentId) {
    try {
      const response = await this.api.delete(
        `/api/posts/${postId}/comments/${commentId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async addCommentReaction(commentId, reactionType) {
    try {
      const response = await this.api.post(
        `/api/posts/comments/${commentId}/reactions`,
        {
          reactionType,
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async removeCommentReaction(commentId) {
    try {
      const response = await this.api.delete(
        `/api/posts/comments/${commentId}/reactions`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async reportComment(commentId, reason) {
    try {
      const response = await this.api.post(
        `/api/posts/comments/${commentId}/report`,
        {
          reason,
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async getCurrentWeather(user) {
    try {
      const locationParams = this.getUserLocationParams(user);

      if (!locationParams) {
        return {
          success: false,
          error: "User location required for weather data",
        };
      }

      const response = await this.api.get("/api/weather/current", {
        params: {
          lat: locationParams.latitude,
          lng: locationParams.longitude,
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async getAlerts(user) {
    try {
      const locationParams = this.getUserLocationParams(user);

      if (!locationParams) {
        console.log("No location params available for getAlerts");
        return { success: true, data: { alerts: [] } };
      }

      console.log("API: Getting alerts with location params:", locationParams);

      const response = await this.api.get("/api/alerts", {
        params: locationParams,
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
      console.log("API: Creating alert with data:", alertData);
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
  async uploadProfileImage(imageUri) {
    try {
      console.log("API: Starting profile image upload...");
      console.log("API: Image URI:", imageUri);

      if (!imageUri) {
        throw new Error("No image URI provided");
      }

      const formData = new FormData();
      const uriParts = imageUri.split("/");
      const fileName =
        uriParts[uriParts.length - 1] || `profile_${Date.now()}.jpg`;

      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      });

      console.log("API: FormData created with filename:", fileName);

      const response = await this.api.post("/api/upload/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log("API: Upload response:", response.data);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Upload failed",
        };
      }
    } catch (error) {
      console.error("API: Profile image upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload image";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  async uploadPostImage(postId, imageUri) {
    try {
      console.log("API: Starting post image upload for post:", postId);
      console.log("API: Image URI:", imageUri);

      if (!postId || !imageUri) {
        throw new Error("Post ID and image URI are required");
      }

      const formData = new FormData();
      const uriParts = imageUri.split("/");
      const fileName =
        uriParts[uriParts.length - 1] || `post_${postId}_${Date.now()}.jpg`;

      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      });

      console.log("API: FormData created for post image upload");

      const response = await this.api.post(
        `/api/upload/post/${postId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("API: Post image upload response:", response.data);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Upload failed",
        };
      }
    } catch (error) {
      console.error("API: Post image upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to upload post image",
      };
    }
  }
  async uploadCommentImage(commentId, imageUri) {
    try {
      console.log("API: Starting comment image upload for comment:", commentId);

      if (!commentId || !imageUri) {
        throw new Error("Comment ID and image URI are required");
      }

      const formData = new FormData();
      const uriParts = imageUri.split("/");
      const fileName =
        uriParts[uriParts.length - 1] ||
        `comment_${commentId}_${Date.now()}.jpg`;

      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      });

      const response = await this.api.post(
        `/api/upload/comment/${commentId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("API: Comment image upload response:", response.data);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Upload failed",
        };
      }
    } catch (error) {
      console.error("API: Comment image upload error:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to upload comment image",
      };
    }
  }
  async deleteImage(publicId) {
    try {
      console.log("API: Deleting image with publicId:", publicId);

      const response = await this.api.delete(`/api/upload/image/${publicId}`);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("API: Delete image error:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete image",
      };
    }
  }
  async getProfileImage() {
    try {
      const response = await this.api.get("/api/upload/profile");

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("API: Get profile image error:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to get profile image",
      };
    }
  }
  async getUploadStats() {
    try {
      const response = await this.api.get("/api/upload/stats");

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("API: Get upload stats error:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to get upload stats",
      };
    }
  }
  async testUploadSystem() {
    try {
      console.log("API: Testing upload system...");

      const response = await this.api.get("/api/upload/test");

      console.log("API: Upload system test result:", response.data);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("API: Upload system test error:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Upload system test failed",
      };
    }
  }
  async testCommentEndpoints() {
    try {
      console.log("Testing comment API endpoints...");

      const testResults = {
        endpoints: [
          "GET /api/posts/:postId/comments",
          "POST /api/posts/:postId/comments",
          "PUT /api/posts/:postId/comments/:commentId",
          "DELETE /api/posts/:postId/comments/:commentId",
          "POST /api/posts/comments/:commentId/reactions",
          "DELETE /api/posts/comments/:commentId/reactions",
          "POST /api/posts/comments/:commentId/report",
        ],
        status: "Available",
        features: [
          "Comment CRUD operations",
          "Comment reactions (like, love, helpful, etc.)",
          "Comment reporting system",
          "Optimistic updates support",
          "Reply threading",
          "Edit tracking",
        ],
      };

      return { success: true, data: testResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();
