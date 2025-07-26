// File: frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "@services/api";

// Auth state interface
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        dispatch({ type: "SET_USER", payload: null });
        return;
      }

      // Verify token with backend
      const result = await apiService.getProfile();
      if (result.success) {
        dispatch({ type: "SET_USER", payload: result.data.user });
      } else {
        // Token is invalid, remove it
        await AsyncStorage.removeItem("authToken");
        dispatch({ type: "SET_USER", payload: null });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await AsyncStorage.removeItem("authToken");
      dispatch({ type: "SET_USER", payload: null });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const result = await apiService.login(email, password);

      if (result.success) {
        await AsyncStorage.setItem("authToken", result.data.token);
        dispatch({ type: "SET_USER", payload: result.data.user });
        return { success: true };
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Login failed. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const result = await apiService.register(userData);

      if (result.success) {
        await AsyncStorage.setItem("authToken", result.data.token);
        dispatch({ type: "SET_USER", payload: result.data.user });
        return { success: true };
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Registration failed. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if AsyncStorage fails
      dispatch({ type: "LOGOUT" });
    }
  };

  const forgotPassword = async (email) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const result = await apiService.forgotPassword(email);

      if (result.success) {
        return { success: true };
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Password reset failed. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const result = await apiService.updateProfile(profileData);

      if (result.success) {
        dispatch({ type: "SET_USER", payload: result.data.user });
        return { success: true };
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Profile update failed. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: "SET_USER", payload: { ...state.user, ...userData } });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    updateProfile,
    updateUser,
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
