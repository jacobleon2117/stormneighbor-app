// File: AuthContext.js
import { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "@services/api";

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        needsProfileSetup: false,
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
        const user = result.data;

        const profileSetupCompleted = await AsyncStorage.getItem(
          "profileSetupCompleted"
        );

        const hasBasicProfile = user.firstName && user.lastName && user.email;
        const hasLocationInfo =
          (user.location?.city && user.location?.state) ||
          (user.address?.city && user.address?.state) ||
          (user.location_city && user.address_state);

        const isProfileComplete = hasBasicProfile && hasLocationInfo;

        if (!isProfileComplete && !profileSetupCompleted) {
          dispatch({
            type: "SET_USER_NEEDS_SETUP",
            payload: { user, needsSetup: true },
          });
        } else {
          dispatch({ type: "SET_USER", payload: user });
          if (!profileSetupCompleted) {
            await AsyncStorage.setItem("profileSetupCompleted", "true");
          }
        }
      } else {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("profileSetupCompleted");
        dispatch({ type: "SET_USER", payload: null });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("profileSetupCompleted");
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

        const user = result.data.user;

        const profileSetupCompleted = await AsyncStorage.getItem(
          "profileSetupCompleted"
        );
        const hasBasicProfile = user.firstName && user.lastName && user.email;
        const hasLocationInfo =
          (user.location?.city && user.location?.state) ||
          (user.address?.city && user.address?.state) ||
          (user.location_city && user.address_state);

        const isProfileComplete = hasBasicProfile && hasLocationInfo;

        if (!isProfileComplete && !profileSetupCompleted) {
          dispatch({
            type: "SET_USER_NEEDS_SETUP",
            payload: { user, needsSetup: true },
          });
        } else {
          dispatch({ type: "SET_USER", payload: user });
          if (!profileSetupCompleted) {
            await AsyncStorage.setItem("profileSetupCompleted", "true");
          }
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
        await AsyncStorage.removeItem("profileSetupCompleted");

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
      await AsyncStorage.removeItem("profileSetupCompleted");
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout failed:", error);
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
        await AsyncStorage.setItem("profileSetupCompleted", "true");

        dispatch({ type: "COMPLETE_PROFILE_SETUP" });

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

  const completeProfileSetup = async () => {
    await AsyncStorage.setItem("profileSetupCompleted", "true");
    dispatch({ type: "COMPLETE_PROFILE_SETUP" });

    try {
      const profileResult = await apiService.getProfile();
      if (profileResult.success) {
        dispatch({ type: "SET_USER", payload: profileResult.data });
      }
    } catch (error) {
      console.error("Error refreshing profile after setup:", error);
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: "SET_USER", payload: { ...state.user, ...userData } });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    needsProfileSetup: state.needsProfileSetup,
    loading: state.loading,
    error: state.error,

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
