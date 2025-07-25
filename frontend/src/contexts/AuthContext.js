// File: frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "@services/api";

// Reducer for auth state
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
      return { ...state, error: action.payload, loading: false };
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
      const result = await apiService.getProfile();
      if (result.success) {
        dispatch({ type: "SET_USER", payload: result.data.user });
      } else {
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
    await AsyncStorage.removeItem("authToken");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
