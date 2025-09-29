import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { User, LoginRequest, RegisterRequest, AuthResponse } from "../types";
import { apiService } from "../services/api";
import { createInitialLoadingState, LoadingState } from "./types";
import { ErrorHandler } from "../utils/errorHandler";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: LoadingState;
  refreshToken: string | null;

  setUser: (user: User | null) => void;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updateLocationPreferences: (preferences: any) => Promise<boolean>;
  updateNotificationPreferences: (preferences: any) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: createInitialLoadingState(),
  refreshToken: null,
};

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    ...initialState,

    setUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
        state.loading.lastUpdated = new Date();
      }),

    login: async (credentials) => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.login(credentials.email, credentials.password);

        if (response.success && response.data) {
          const authData = response.data as AuthResponse;
          set((state) => {
            state.user = authData.user;
            state.isAuthenticated = true;
            state.refreshToken = authData.refreshToken;
            state.loading.lastUpdated = new Date();
          });
          return true;
        } else {
          set((state) => {
            state.loading.error = response.message || "Login failed";
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Login failed";
        set((state) => {
          state.loading.error = errorMessage;
        });
        return false;
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    register: async (userData) => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.register(userData);

        if (response.success && response.data) {
          const authData = response.data as AuthResponse;
          set((state) => {
            state.user = authData.user;
            state.isAuthenticated = true;
            state.refreshToken = authData.refreshToken;
            state.loading.lastUpdated = new Date();
          });
          return true;
        } else {
          set((state) => {
            state.loading.error = response.message || "Registration failed";
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Registration failed";
        set((state) => {
          state.loading.error = errorMessage;
        });
        return false;
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    logout: async () => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        await apiService.logout();
      } catch (error: any) {
        ErrorHandler.silent(error as Error, "Logout API call failed");
      } finally {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.refreshToken = null;
          state.loading.isLoading = false;
          state.loading.error = null;
          state.loading.lastUpdated = new Date();
        });
      }
    },

    refreshProfile: async () => {
      if (!get().isAuthenticated) return;

      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.getProfile();

        if (response.success && response.data) {
          set((state) => {
            state.user = response.data as User;
            state.loading.lastUpdated = new Date();
          });
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to refresh profile";
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to refresh profile";
        set((state) => {
          state.loading.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    updateProfile: async (updates) => {
      if (!get().isAuthenticated) return false;

      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.updateProfile(updates);

        if (response.success && response.data) {
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates);
            }
            state.loading.lastUpdated = new Date();
          });
          return true;
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to update profile";
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to update profile";
        set((state) => {
          state.loading.error = errorMessage;
        });
        return false;
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    updateLocationPreferences: async (preferences) => {
      if (!get().isAuthenticated) return false;

      try {
        const response = await apiService.updateProfile({ locationPreferences: preferences });

        if (response.success) {
          set((state) => {
            if (state.user) {
              state.user.locationPreferences = preferences;
            }
            state.loading.lastUpdated = new Date();
          });
          return true;
        }
        return false;
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to update location preferences";
        });
        return false;
      }
    },

    updateNotificationPreferences: async (preferences) => {
      if (!get().isAuthenticated) return false;

      try {
        const response = await apiService.updateNotificationPreferences(preferences);

        if (response.success) {
          set((state) => {
            if (state.user) {
              state.user.notificationPreferences = preferences;
            }
            state.loading.lastUpdated = new Date();
          });
          return true;
        }
        return false;
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to update notification preferences";
        });
        return false;
      }
    },

    clearError: () =>
      set((state) => {
        state.loading.error = null;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading.isLoading);
export const useAuthError = () => useAuthStore((state) => state.loading.error);
