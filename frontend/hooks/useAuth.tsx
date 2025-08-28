import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "../services/api";
import { NotificationService } from "../services/notifications";
import { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasLoggedOut: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<User>;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_MANUAL_LOGOUT" }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  hasLoggedOut: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        hasLoggedOut: false,
      };
    case "AUTH_MANUAL_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        hasLoggedOut: true,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await apiService.getAccessToken();
      if (token) {
        console.log("Token found, fetching user profile");
        const response = await apiService.getProfile();
        console.log("Initial auth check - profile data:", {
          locationCity: response.data?.locationCity,
          latitude: response.data?.latitude,
          longitude: response.data?.longitude,
          addressState: response.data?.addressState,
          hasFullData: !!(
            response.data?.locationCity ||
            (response.data?.latitude && response.data?.longitude)
          ),
        });
        dispatch({ type: "AUTH_SUCCESS", payload: response.data });

        try {
          await NotificationService.registerForPushNotifications();
        } catch (error) {
          console.log("Failed to register for push notifications:", error);
        }
      } else {
        console.log("No token found, dispatching logout");
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      console.log("No existing authentication found:", error);
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await apiService.login(email, password);
      dispatch({ type: "AUTH_SUCCESS", payload: response.data.user });

      try {
        await NotificationService.registerForPushNotifications();
      } catch (error) {
        console.log("Failed to register for push notifications:", error);
      }
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || "Login failed";
      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    dispatch({ type: "AUTH_START" });
    try {
      console.log("Attempting registration with:", {
        ...userData,
        password: "[HIDDEN]",
      });
      await apiService.register(userData);
      console.log("Registration successful, attempting login...");
      await login(userData.email, userData.password);
      console.log("Login after registration successful");
    } catch (error) {
      console.error("Registration/login error:", error);
      const errorMessage =
        (error as any).response?.data?.message || "Registration failed";
      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_MANUAL_LOGOUT" });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshProfile = async () => {
    try {
      console.log("Refreshing user profile");
      const response = await apiService.getProfile();
      console.log("Profile data received:", {
        locationCity: response.data?.locationCity,
        latitude: response.data?.latitude,
        longitude: response.data?.longitude,
        addressState: response.data?.addressState,
        hasLocationData: !!(
          response.data?.locationCity ||
          (response.data?.latitude && response.data?.longitude)
        ),
      });
      dispatch({ type: "AUTH_SUCCESS", payload: response.data });
      console.log("Profile refreshed successfully");
      return response.data;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
