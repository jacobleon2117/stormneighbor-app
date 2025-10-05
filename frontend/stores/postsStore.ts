import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Post, SearchFilters, CreatePostForm } from "../types";
import { apiService } from "../services/api";
import {
  createInitialLoadingState,
  createInitialPaginationState,
  LoadingState,
  PaginationState,
} from "./types";

interface FetchPostsParams {
  page?: number;
  isRefresh?: boolean;
  city?: string;
  state?: string;
}

interface PostsState {
  posts: Post[];
  searchResults: Post[];
  filters: SearchFilters;
  pagination: PaginationState;
  loading: LoadingState;
  isRefreshing: LoadingState;
  loadingMore: LoadingState;
  searching: LoadingState;

  fetchPosts: (params: FetchPostsParams) => Promise<void>;
  searchPosts: (query: string, filters?: SearchFilters) => Promise<void>;
  createPost: (postData: CreatePostForm) => Promise<boolean>;
  updatePost: (postId: number, updates: Partial<Post>) => Promise<boolean>;
  deletePost: (postId: number) => Promise<boolean>;
  likePost: (postId: number) => Promise<void>;
  hidePost: (postId: number) => void;
  setFilters: (filters: SearchFilters) => void;
  clearSearch: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  posts: [],
  searchResults: [],
  filters: {
    types: [],
    priorities: [],
    emergencyOnly: false,
    resolved: "all" as const,
    sortBy: "date" as const,
  },
  pagination: createInitialPaginationState(),
  loading: createInitialLoadingState(),
  isRefreshing: createInitialLoadingState(),
  loadingMore: createInitialLoadingState(),
  searching: createInitialLoadingState(),
};

export const usePostsStore = create<PostsState>()(
  immer((set, get) => ({
    ...initialState,

    fetchPosts: async (params: FetchPostsParams) => {
      const { page = 1, isRefresh = false, city, state: userState } = params;
      const currentState = get();

      if (
        currentState.loading.isLoading ||
        currentState.loadingMore.isLoading ||
        currentState.isRefreshing.isLoading
      ) {
        return;
      }

      if (isRefresh) {
        set((state) => {
          state.isRefreshing.isLoading = true;
          state.isRefreshing.error = null;
        });
      } else if (page > 1) {
        set((state) => {
          state.loadingMore.isLoading = true;
          state.loadingMore.error = null;
        });
      } else {
        set((state) => {
          state.loading.isLoading = true;
          state.loading.error = null;
        });
      }

      try {
        const response = await apiService.getPosts({ page, limit: 20, city, state: userState });

        if (response.success && response.data) {
          set((state) => {
            const newPosts = response.data.posts || response.data;

            if (isRefresh || page === 1) {
              state.posts = newPosts;
              state.pagination.page = 1;
            } else {
              state.posts.push(...newPosts);
              state.pagination.page = page;
            }

            state.pagination.hasMore = newPosts.length === 20;
            state.loading.lastUpdated = new Date();
          });
        } else {
          const errorMessage = response.message || "Failed to fetch posts";
          set((state) => {
            if (isRefresh) {
              state.isRefreshing.error = errorMessage;
            } else if (page > 1) {
              state.loadingMore.error = errorMessage;
            } else {
              state.loading.error = errorMessage;
            }
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to fetch posts";
        set((state) => {
          if (isRefresh) {
            state.isRefreshing.error = errorMessage;
          } else if (page > 1) {
            state.loadingMore.error = errorMessage;
          } else {
            state.loading.error = errorMessage;
          }
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
          state.isRefreshing.isLoading = false;
          state.loadingMore.isLoading = false;
        });
      }
    },

    searchPosts: async (query, filters) => {
      set((state) => {
        state.searching.isLoading = true;
        state.searching.error = null;
        if (filters) {
          state.filters = filters;
        }
      });

      try {
        const response = await apiService.searchPosts(query, filters);

        if (response.success && response.data) {
          set((state) => {
            state.searchResults = response.data.posts || response.data;
            state.searching.lastUpdated = new Date();
          });
        } else {
          set((state) => {
            state.searching.error = response.message || "Search failed";
          });
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Search failed";
        set((state) => {
          state.searching.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.searching.isLoading = false;
        });
      }
    },

    createPost: async (postData) => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.createPost(postData);

        if (response.success && response.data) {
          const newPost = response.data as Post;
          set((state) => {
            state.posts.unshift(newPost);
            state.loading.lastUpdated = new Date();
          });
          return true;
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to create post";
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to create post";
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

    updatePost: async (postId, updates) => {
      try {
        const response = await apiService.updatePost(postId, updates);

        if (response.success) {
          set((state) => {
            const postIndex = state.posts.findIndex((p) => p.id === postId);
            if (postIndex !== -1) {
              Object.assign(state.posts[postIndex], updates);
            }

            const searchIndex = state.searchResults.findIndex((p) => p.id === postId);
            if (searchIndex !== -1) {
              Object.assign(state.searchResults[searchIndex], updates);
            }
          });
          return true;
        }
        return false;
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to update post";
        });
        return false;
      }
    },

    deletePost: async (postId) => {
      try {
        const response = await apiService.deletePost(postId);

        if (response.success) {
          set((state) => {
            state.posts = state.posts.filter((p) => p.id !== postId);
            state.searchResults = state.searchResults.filter((p) => p.id !== postId);
          });
          return true;
        }
        return false;
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to delete post";
        });
        return false;
      }
    },

    likePost: async (postId) => {
      try {
        const response = await apiService.togglePostReaction(postId, "like");

        if (response.success) {
          set((state) => {
            const postIndex = state.posts.findIndex((p) => p.id === postId);
            if (postIndex !== -1) {
              const post = state.posts[postIndex];
              const wasLiked = post.userReaction === "like";

              post.userReaction = wasLiked ? null : "like";
              post.likeCount = (post.likeCount || 0) + (wasLiked ? -1 : 1);

              if (post.reactionCount !== undefined) {
                post.reactionCount += wasLiked ? -1 : 1;
              }
            }

            const searchIndex = state.searchResults.findIndex((p) => p.id === postId);
            if (searchIndex !== -1) {
              const post = state.searchResults[searchIndex];
              const wasLiked = post.userReaction === "like";

              post.userReaction = wasLiked ? null : "like";
              post.likeCount = (post.likeCount || 0) + (wasLiked ? -1 : 1);

              if (post.reactionCount !== undefined) {
                post.reactionCount += wasLiked ? -1 : 1;
              }
            }
          });
        }
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to like post";
        });
      }
    },

    setFilters: (filters) =>
      set((state) => {
        state.filters = filters;
      }),

    clearSearch: () =>
      set((state) => {
        state.searchResults = [];
        state.searching = createInitialLoadingState();
      }),

    clearError: () =>
      set((state) => {
        state.loading.error = null;
        state.isRefreshing.error = null;
        state.loadingMore.error = null;
        state.searching.error = null;
      }),

    hidePost: (postId) =>
      set((state) => {
        state.posts = state.posts.filter((post) => post.id !== postId);
        state.searchResults = state.searchResults.filter((post) => post.id !== postId);
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

export const usePostsList = () => usePostsStore((state) => state.posts);
export const useSearchResults = () => usePostsStore((state) => state.searchResults);
export const usePostsLoading = () => usePostsStore((state) => state.loading.isLoading);
export const usePostsRefreshing = () => usePostsStore((state) => state.isRefreshing.isLoading);
export const usePostsLoadingMore = () => usePostsStore((state) => state.loadingMore.isLoading);
export const usePostsSearching = () => usePostsStore((state) => state.searching.isLoading);
export const usePostsError = () => usePostsStore((state) => state.loading.error);
export const usePostsFilters = () => usePostsStore((state) => state.filters);
export const usePostsPagination = () => usePostsStore((state) => state.pagination);
