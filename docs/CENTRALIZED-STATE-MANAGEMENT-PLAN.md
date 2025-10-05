# Centralized State Management Implementation Plan

## Overview
This document outlines the complete implementation plan for adding centralized state management to the StormNeighbor app using Zustand for optimal TypeScript integration and minimal boilerplate.

## Current State Analysis

### Existing State Patterns
- **Auth State**: Partially centralized in `useAuth` hook
- **Component State**: Scattered `useState` across components
- **Loading States**: Recently standardized with `useLoadingState` utility
- **Error Handling**: Recently standardized with `useErrorHandler` utility

### State Categories Identified
1. **Authentication & User Data**
2. **Posts & Feed Data**
3. **Notifications**
4. **App Preferences**
5. **Location & Weather Data**
6. **Messages & Conversations**

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install zustand immer
npm install @types/zustand --save-dev
```

### Step 2: Create Store Architecture

#### 2.1 Base Store Types (`src/stores/types.ts`)
```typescript
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
}
```

#### 2.2 Auth Store (`src/stores/authStore.ts`)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (user) => set((state) => {
      state.user = user;
      state.isAuthenticated = !!user;
    }),

    login: async (credentials) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const response = await apiService.login(credentials);
        if (response.success) {
          set((state) => {
            state.user = response.data.user;
            state.isAuthenticated = true;
          });
        }
      } catch (error) {
        set((state) => { state.error = error.message; });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    logout: async () => {
      set((state) => { state.isLoading = true; });
      try {
        await apiService.logout();
        get().reset();
      } catch (error) {
        set((state) => { state.error = error.message; });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    refreshProfile: async () => {
      // Implementation
    },

    updateProfile: async (updates) => {
      // Implementation
    },

    clearError: () => set((state) => { state.error = null; }),

    reset: () => set((state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    }),
  }))
);
```

#### 2.3 Posts Store (`src/stores/postsStore.ts`)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Post, SearchFilters } from '../types';

interface PostsState {
  posts: Post[];
  searchResults: Post[];
  filters: SearchFilters;
  pagination: PaginationState;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isSearching: boolean;
  error: string | null;

  // Actions
  fetchPosts: (page?: number, refresh?: boolean) => Promise<void>;
  searchPosts: (query: string, filters?: SearchFilters) => Promise<void>;
  likePost: (postId: number) => Promise<void>;
  createPost: (postData: CreatePostData) => Promise<void>;
  updatePost: (postId: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  setFilters: (filters: SearchFilters) => void;
  clearSearch: () => void;
  reset: () => void;
}

export const usePostsStore = create<PostsState>()(
  immer((set, get) => ({
    posts: [],
    searchResults: [],
    filters: {
      types: [],
      priorities: [],
      emergencyOnly: false,
      resolved: "all",
      sortBy: "date",
    },
    pagination: { page: 1, hasMore: true },
    isLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    isSearching: false,
    error: null,

    fetchPosts: async (page = 1, refresh = false) => {
      if (refresh) {
        set((state) => { state.isRefreshing = true; });
      } else if (page > 1) {
        set((state) => { state.isLoadingMore = true; });
      } else {
        set((state) => { state.isLoading = true; });
      }

      try {
        const response = await apiService.getPosts({ page, limit: 20 });
        if (response.success) {
          set((state) => {
            if (refresh || page === 1) {
              state.posts = response.data.posts;
            } else {
              state.posts.push(...response.data.posts);
            }
            state.pagination.page = page;
            state.pagination.hasMore = response.data.posts.length === 20;
          });
        }
      } catch (error) {
        set((state) => { state.error = error.message; });
      } finally {
        set((state) => {
          state.isLoading = false;
          state.isRefreshing = false;
          state.isLoadingMore = false;
        });
      }
    },

    searchPosts: async (query, filters) => {
      set((state) => { state.isSearching = true; state.error = null; });
      try {
        const response = await apiService.searchPosts(query, filters);
        if (response.success) {
          set((state) => { state.searchResults = response.data.posts; });
        }
      } catch (error) {
        set((state) => { state.error = error.message; });
      } finally {
        set((state) => { state.isSearching = false; });
      }
    },

    likePost: async (postId) => {
      try {
        const response = await apiService.likePost(postId);
        if (response.success) {
          set((state) => {
            const postIndex = state.posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
              state.posts[postIndex].isLiked = !state.posts[postIndex].isLiked;
              state.posts[postIndex].likesCount += state.posts[postIndex].isLiked ? 1 : -1;
            }
          });
        }
      } catch (error) {
        set((state) => { state.error = error.message; });
      }
    },

    // Additional methods...
    setFilters: (filters) => set((state) => { state.filters = filters; }),
    clearSearch: () => set((state) => { state.searchResults = []; }),
    reset: () => set(() => ({
      posts: [],
      searchResults: [],
      pagination: { page: 1, hasMore: true },
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      isSearching: false,
      error: null,
    })),
  }))
);
```

#### 2.4 Notifications Store (`src/stores/notificationsStore.ts`)
```typescript
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  reset: () => void;
}
```

#### 2.5 Messages Store (`src/stores/messagesStore.ts`)
```typescript
interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  createConversation: (userId: number) => Promise<void>;
  reset: () => void;
}
```

### Step 3: Create Store Provider (`src/stores/index.ts`)
```typescript
export { useAuthStore } from './authStore';
export { usePostsStore } from './postsStore';
export { useNotificationsStore } from './notificationsStore';
export { useMessagesStore } from './messagesStore';

// Optional: Create a root store that combines all stores
export const useStores = () => ({
  auth: useAuthStore(),
  posts: usePostsStore(),
  notifications: useNotificationsStore(),
  messages: useMessagesStore(),
});
```

### Step 4: Migration Strategy

#### 4.1 Replace useAuth Hook
**Current**: `hooks/useAuth.ts`
**New**: Direct usage of `useAuthStore`

```typescript
// Before (in components)
const { user, login, logout } = useAuth();

// After
const { user, login, logout } = useAuthStore();
```

#### 4.2 Update Authentication Screens
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/location-setup.tsx`
- `app/(auth)/notifications-setup.tsx`

#### 4.3 Update Main App Screens
- `app/(tabs)/index.tsx` - Posts feed
- `app/(tabs)/profile.tsx` - User profile
- `app/(tabs)/messages.tsx` - Conversations
- `app/(tabs)/notifications.tsx` - Notifications list
- `app/(tabs)/create.tsx` - Post creation

### Step 5: Integration with Existing Utilities

#### 5.1 Error Handling Integration
```typescript
// In stores, use the error handler utility
import { ErrorHandler } from '../utils/errorHandler';

// In catch blocks
catch (error) {
  const appError = ErrorHandler.fromApiError(error);
  set((state) => { state.error = appError.message; });
  ErrorHandler.silent(appError, 'Posts Store');
}
```

#### 5.2 Loading States Integration
Keep existing `useLoadingState` for component-specific loading, use store loading for global state.

### Step 6: Performance Optimizations

#### 6.1 Selectors for Specific Data
```typescript
// Create specific selectors to prevent unnecessary re-renders
export const useAuthUser = () => useAuthStore((state) => state.user);
export const usePostsList = () => usePostsStore((state) => state.posts);
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount);
```

#### 6.2 Devtools Integration
```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    immer((set, get) => ({
      // store implementation
    })),
    { name: 'auth-store' }
  )
);
```

### Step 7: Testing Strategy

#### 7.1 Store Testing
```typescript
// Example test for authStore
import { useAuthStore } from '../stores/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('should login user successfully', async () => {
    const { login } = useAuthStore.getState();
    await login({ email: 'test@test.com', password: 'password' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

### Step 8: Migration Checklist

#### Phase 1: Core Auth
- [ ] Create authStore
- [ ] Replace useAuth hook usage
- [ ] Update login/register flows
- [ ] Test authentication flows

#### Phase 2: Posts Management
- [ ] Create postsStore
- [ ] Update index.tsx (home feed)
- [ ] Update create.tsx (post creation)
- [ ] Update search functionality
- [ ] Test CRUD operations

#### Phase 3: Communications
- [ ] Create notificationsStore
- [ ] Create messagesStore
- [ ] Update notifications screen
- [ ] Update messages screen
- [ ] Test real-time updates

#### Phase 4: Optimization
- [ ] Add selectors for performance
- [ ] Implement devtools
- [ ] Add comprehensive tests
- [ ] Remove old useState patterns

### Step 9: Benefits After Implementation

#### Performance Improvements
- Reduced prop drilling
- Optimized re-renders with selectors
- Centralized cache management
- Better memory usage

#### Developer Experience
- Single source of truth for state
- Better debugging with devtools
- Consistent state patterns
- Easier testing

#### Maintainability
- Clear separation of concerns
- Predictable state updates
- Easier to add new features
- Better error handling

### Step 10: Future Enhancements

#### Real-time Integration
- WebSocket state management
- Optimistic updates
- Conflict resolution

#### Offline Support
- State persistence
- Sync strategies
- Queue management

#### Advanced Features
- State history/undo
- State snapshots
- Cross-tab synchronization

## File Structure After Implementation

```
src/
├── stores/
│   ├── index.ts              # Main store exports
│   ├── types.ts              # Common store types
│   ├── authStore.ts          # Authentication state
│   ├── postsStore.ts         # Posts and feed state
│   ├── notificationsStore.ts # Notifications state
│   ├── messagesStore.ts      # Messages state
│   └── __tests__/           # Store tests
├── utils/
│   ├── errorHandler.ts       # Existing (integrate with stores)
│   └── loadingStates.ts      # Existing (keep for component state)
└── hooks/
    └── useAuth.ts            # Remove after migration
```

## Timeline Estimate
- **Phase 1 (Auth)**: 1-2 days
- **Phase 2 (Posts)**: 2-3 days
- **Phase 3 (Communications)**: 2-3 days
- **Phase 4 (Optimization)**: 1-2 days
- **Total**: 6-10 days

## Risk Mitigation
1. **Gradual Migration**: Implement store-by-store to minimize disruption
2. **Backup Strategy**: Keep old patterns until new ones are proven
3. **Testing**: Comprehensive testing at each phase
4. **Rollback Plan**: Ability to revert individual stores if issues arise

This implementation will provide a solid, scalable foundation for the StormNeighbor app's state management while maintaining the excellent consistency patterns we've already established.