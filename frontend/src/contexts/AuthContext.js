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

    case "SET_USER_NEEDS_SETUP":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        needsProfileSetup: action.payload.needsSetup,
        loading: false,
      };

    case "COMPLETE_PROFILE_SETUP":
      return {
        ...state,
        needsProfileSetup: false,
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
        needsProfileSetup: false,
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
  needsProfileSetup: false,
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
        // Check if user needs profile setup (no neighborhood, missing key info, etc.)
        const user = result.data;
        const needsSetup = !user.neighborhoodId || !user.address?.city;

        if (needsSetup) {
          dispatch({
            type: "SET_USER_NEEDS_SETUP",
            payload: { user, needsSetup: true },
          });
        } else {
          dispatch({ type: "SET_USER", payload: user });
        }
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

        // Check if user needs profile setup
        const user = result.data.user;
        const needsSetup = !user.neighborhoodId || !user.address?.city;

        if (needsSetup) {
          dispatch({
            type: "SET_USER_NEEDS_SETUP",
            payload: { user, needsSetup: true },
          });
        } else {
          dispatch({ type: "SET_USER", payload: user });
        }

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

        // New users always need profile setup
        dispatch({
          type: "SET_USER_NEEDS_SETUP",
          payload: { user: result.data.user, needsSetup: true },
        });

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
        // After successful profile update, mark setup as complete
        dispatch({ type: "COMPLETE_PROFILE_SETUP" });

        // Refresh user data
        const profileResult = await apiService.getProfile();
        if (profileResult.success) {
          dispatch({ type: "SET_USER", payload: profileResult.data });
        }

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

  const completeProfileSetup = () => {
    dispatch({ type: "COMPLETE_PROFILE_SETUP" });
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
    needsProfileSetup: state.needsProfileSetup,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    updateProfile,
    completeProfileSetup,
    updateUser,
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
