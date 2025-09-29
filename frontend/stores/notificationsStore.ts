import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Notification } from "../types";
import { apiService } from "../services/api";
import { createInitialLoadingState, LoadingState } from "./types";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: LoadingState;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateUnreadCount: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: createInitialLoadingState(),
};

export const useNotificationsStore = create<NotificationsState>()(
  immer((set, get) => ({
    ...initialState,

    fetchNotifications: async () => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.getNotifications();

        if (response.success && response.data) {
          const notifications = response.data.notifications || response.data;
          set((state) => {
            state.notifications = notifications;
            state.unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
            state.loading.lastUpdated = new Date();
          });
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to fetch notifications";
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to fetch notifications";
        set((state) => {
          state.loading.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    markAsRead: async (notificationId) => {
      try {
        const response = await apiService.markNotificationAsRead(notificationId);

        if (response.success) {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            if (notification && !notification.isRead) {
              notification.isRead = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
        }
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to mark notification as read";
        });
      }
    },

    markAllAsRead: async () => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.markAllNotificationsAsRead();

        if (response.success) {
          set((state) => {
            state.notifications.forEach((notification) => {
              notification.isRead = true;
            });
            state.unreadCount = 0;
          });
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to mark all notifications as read";
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to mark all notifications as read";
        set((state) => {
          state.loading.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    deleteNotification: async (notificationId) => {
      try {
        const response = await apiService.deleteNotification(notificationId);

        if (response.success) {
          set((state) => {
            const notificationIndex = state.notifications.findIndex((n) => n.id === notificationId);
            if (notificationIndex !== -1) {
              const notification = state.notifications[notificationIndex];
              if (!notification.isRead) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.notifications.splice(notificationIndex, 1);
            }
          });
        }
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to delete notification";
        });
      }
    },

    addNotification: (notification) =>
      set((state) => {
        state.notifications.unshift(notification);

        if (!notification.isRead) {
          state.unreadCount += 1;
        }
      }),

    updateUnreadCount: () =>
      set((state) => {
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
      }),

    clearError: () =>
      set((state) => {
        state.loading.error = null;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

export const useNotificationsList = () => useNotificationsStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount);
export const useNotificationsLoading = () =>
  useNotificationsStore((state) => state.loading.isLoading);
export const useNotificationsError = () => useNotificationsStore((state) => state.loading.error);
