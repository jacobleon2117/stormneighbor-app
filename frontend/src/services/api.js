import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.89:3000";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
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

  // Posts
  async getPosts(neighborhoodId) {
    try {
      const response = await this.api.get("/api/posts", {
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
}

export default new ApiService();
