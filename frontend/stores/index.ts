import { useAuthStore } from "./authStore";
import { usePostsStore } from "./postsStore";
import { useNotificationsStore } from "./notificationsStore";
import { useMessagesStore } from "./messagesStore";

export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
} from "./authStore";
export {
  usePostsStore,
  usePostsList,
  useSearchResults,
  usePostsLoading,
  usePostsRefreshing,
  usePostsLoadingMore,
  usePostsSearching,
  usePostsError,
  usePostsFilters,
  usePostsPagination,
} from "./postsStore";
export {
  useNotificationsStore,
  useNotificationsList,
  useUnreadCount,
  useNotificationsLoading,
  useNotificationsError,
} from "./notificationsStore";
export {
  useMessagesStore,
  useConversationsList,
  useCurrentConversation,
  useMessagesList,
  useMessagesLoading,
  useSendingMessage,
  useMessagesError,
} from "./messagesStore";

export type { LoadingState, PaginationState, BaseStore } from "./types";

export const useStores = () => ({
  auth: useAuthStore(),
  posts: usePostsStore(),
  notifications: useNotificationsStore(),
  messages: useMessagesStore(),
});

export const resetAllStores = () => {
  useAuthStore.getState().reset();
  usePostsStore.getState().reset();
  useNotificationsStore.getState().reset();
  useMessagesStore.getState().reset();
};
