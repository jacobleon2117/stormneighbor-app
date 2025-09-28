import { Alert } from "react-native";

export interface AppError {
  message: string;
  code?: string;
  type: "network" | "validation" | "auth" | "server" | "unknown";
  details?: any;
}

export class ErrorHandler {
  static show(error: AppError | Error | string, context?: string) {
    const errorMessage = this.formatErrorMessage(error);
    const title = this.getErrorTitle(error);

    console.error(`[${context || "App"}] Error:`, error);

    Alert.alert(
      title,
      errorMessage,
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  }

  static showWithRetry(
    error: AppError | Error | string,
    onRetry: () => void,
    context?: string
  ) {
    const errorMessage = this.formatErrorMessage(error);
    const title = this.getErrorTitle(error);

    console.error(`[${context || "App"}] Error with retry:`, error);

    Alert.alert(
      title,
      errorMessage,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", style: "default", onPress: onRetry }
      ],
      { cancelable: true }
    );
  }

  static silent(error: AppError | Error | string, context?: string) {
    console.error(`[${context || "App"}] Silent error:`, error);
  }

  private static formatErrorMessage(error: AppError | Error | string): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message || "An unexpected error occurred";
    }

    // AppError
    if (error.type === "network") {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    if (error.type === "auth") {
      return "Your session has expired. Please log in again.";
    }

    if (error.type === "validation") {
      return error.message || "Please check your input and try again.";
    }

    return error.message || "An unexpected error occurred";
  }

  private static getErrorTitle(error: AppError | Error | string): string {
    if (typeof error === "string") {
      return "Error";
    }

    if (error instanceof Error) {
      return "Error";
    }

    // AppError
    switch (error.type) {
      case "network":
        return "Connection Error";
      case "auth":
        return "Authentication Error";
      case "validation":
        return "Invalid Input";
      case "server":
        return "Server Error";
      default:
        return "Error";
    }
  }

  static fromApiError(apiError: any): AppError {
    // Handle different API error formats
    if (apiError.response) {
      const { status, data } = apiError.response;

      if (status === 401) {
        return {
          message: data.message || "Authentication required",
          code: data.code,
          type: "auth",
          details: data
        };
      }

      if (status === 400) {
        return {
          message: data.message || "Invalid request",
          code: data.code,
          type: "validation",
          details: data
        };
      }

      if (status >= 500) {
        return {
          message: "Server error. Please try again later.",
          code: data.code,
          type: "server",
          details: data
        };
      }

      return {
        message: data.message || "Request failed",
        code: data.code,
        type: "unknown",
        details: data
      };
    }

    // Network errors
    if (apiError.code === "NETWORK_ERROR" || !apiError.response) {
      return {
        message: "Unable to connect to server",
        type: "network",
        details: apiError
      };
    }

    return {
      message: apiError.message || "An unexpected error occurred",
      type: "unknown",
      details: apiError
    };
  }
}

// Hook for consistent error handling in components
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    const appError = ErrorHandler.fromApiError(error);
    ErrorHandler.show(appError, context);
  };

  const handleErrorWithRetry = (error: any, onRetry: () => void, context?: string) => {
    const appError = ErrorHandler.fromApiError(error);
    ErrorHandler.showWithRetry(appError, onRetry, context);
  };

  const handleSilentError = (error: any, context?: string) => {
    const appError = ErrorHandler.fromApiError(error);
    ErrorHandler.silent(appError, context);
  };

  return {
    handleError,
    handleErrorWithRetry,
    handleSilentError
  };
};