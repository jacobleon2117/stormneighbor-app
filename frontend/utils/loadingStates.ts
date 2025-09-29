import { useState, useCallback } from "react";

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useLoadingState = (initialLoading = false) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    lastUpdated: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error,
    }));
  }, []);

  const setSuccess = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
  };
};

export const useAsyncOperation = <T = any>() => {
  const loadingState = useLoadingState();
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: any) => void
    ) => {
      loadingState.setLoading(true);
      try {
        const result = await operation();
        setData(result);
        loadingState.setSuccess();
        onSuccess?.(result);
        return result;
      } catch (error) {
        loadingState.setError(error instanceof Error ? error.message : String(error));
        onError?.(error);
        throw error;
      }
    },
    [loadingState]
  );

  return {
    ...loadingState,
    data,
    execute,
    setData,
  };
};
