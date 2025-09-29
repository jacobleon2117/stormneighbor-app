export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface PaginationState {
  page: number;
  hasMore: boolean;
  total?: number;
}

export interface BaseStore {
  reset: () => void;
  loading: LoadingState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const createInitialLoadingState = (isLoading = false): LoadingState => ({
  isLoading,
  error: null,
  lastUpdated: null,
});

export const createInitialPaginationState = (): PaginationState => ({
  page: 1,
  hasMore: true,
  total: undefined,
});
