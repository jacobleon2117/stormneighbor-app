import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "../services/api";
import { NotificationService } from "../services/notifications";
import { User, AuthResponse } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
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
        const response = await apiService.getProfile();
        dispatch({ type: "AUTH_SUCCESS", payload: response.data });

        try {
          await NotificationService.registerForPushNotifications();
        } catch (error) {
          console.log("Failed to register for push notifications:", error);
        }
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch (error) {
      console.log("No existing authentication found");
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
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
      const response = await apiService.register(userData);
      console.log("Registration successful, attempting login...");
      await login(userData.email, userData.password);
      console.log("Login after registration successful");
    } catch (error: any) {
      console.error("Registration/login error:", error);
      const errorMessage =
        error.response?.data?.message || "Registration failed";
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
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
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
