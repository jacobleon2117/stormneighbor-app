import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Conversation, Message } from "../types";
import { apiService } from "../services/api";
import { createInitialLoadingState, LoadingState } from "./types";

interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: LoadingState;
  sendingMessage: LoadingState;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string, images?: string[]) => Promise<boolean>;
  createConversation: (userId: number, initialMessage: string) => Promise<number | null>;
  markMessagesAsRead: (conversationId: number) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: createInitialLoadingState(),
  sendingMessage: createInitialLoadingState(),
};

export const useMessagesStore = create<MessagesState>()(
  immer((set, get) => ({
    ...initialState,

    fetchConversations: async () => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.getConversations();

        if (response.success && response.data) {
          const conversations = response.data.conversations || response.data;
          set((state) => {
            state.conversations = conversations;
            state.loading.lastUpdated = new Date();
          });
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to fetch conversations";
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to fetch conversations";
        set((state) => {
          state.loading.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    fetchMessages: async (conversationId) => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.getMessages(conversationId);

        if (response.success && response.data) {
          const messages = response.data.messages || response.data;
          set((state) => {
            state.messages = messages;
            state.loading.lastUpdated = new Date();
          });
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to fetch messages";
          });
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to fetch messages";
        set((state) => {
          state.loading.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    sendMessage: async (conversationId, content, images = []) => {
      set((state) => {
        state.sendingMessage.isLoading = true;
        state.sendingMessage.error = null;
      });

      try {
        const messageData = {
          content,
          messageType: images.length > 0 ? "image" : "text",
          images,
        };

        const response = await apiService.sendMessage(conversationId, messageData);

        if (response.success && response.data) {
          const newMessage = response.data as Message;
          set((state) => {
            state.messages.push(newMessage);

            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              conversation.lastMessage = {
                content,
                senderId: newMessage.senderId,
                messageType: newMessage.messageType,
                createdAt: newMessage.createdAt,
              };
              conversation.lastMessageAt = newMessage.createdAt;
            }

            if (state.currentConversation?.id === conversationId) {
              if (state.currentConversation.lastMessage) {
                state.currentConversation.lastMessage.content = content;
                state.currentConversation.lastMessage.senderId = newMessage.senderId;
                state.currentConversation.lastMessage.messageType = newMessage.messageType;
                state.currentConversation.lastMessage.createdAt = newMessage.createdAt;
              }
              state.currentConversation.lastMessageAt = newMessage.createdAt;
            }

            state.sendingMessage.lastUpdated = new Date();
          });
          return true;
        } else {
          set((state) => {
            state.sendingMessage.error = response.message || "Failed to send message";
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to send message";
        set((state) => {
          state.sendingMessage.error = errorMessage;
        });
        return false;
      } finally {
        set((state) => {
          state.sendingMessage.isLoading = false;
        });
      }
    },

    createConversation: async (userId, initialMessage) => {
      set((state) => {
        state.loading.isLoading = true;
        state.loading.error = null;
      });

      try {
        const response = await apiService.createConversation(userId, initialMessage);

        if (response.success && response.data) {
          const newConversation = response.data as Conversation;
          set((state) => {
            state.conversations.unshift(newConversation);
            state.currentConversation = newConversation;
            state.loading.lastUpdated = new Date();
          });
          return newConversation.id;
        } else {
          set((state) => {
            state.loading.error = response.message || "Failed to create conversation";
          });
          return null;
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to create conversation";
        set((state) => {
          state.loading.error = errorMessage;
        });
        return null;
      } finally {
        set((state) => {
          state.loading.isLoading = false;
        });
      }
    },

    markMessagesAsRead: async (conversationId) => {
      try {
        const response = await apiService.markMessagesAsRead(conversationId);

        if (response.success) {
          set((state) => {
            state.messages.forEach((message) => {
              if (message.conversationId === conversationId) {
                message.isRead = true;
                message.readAt = new Date().toISOString();
              }
            });

            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              conversation.unreadCount = 0;
            }

            if (state.currentConversation?.id === conversationId) {
              state.currentConversation.unreadCount = 0;
            }
          });
        }
      } catch (error: any) {
        set((state) => {
          state.loading.error = error.message || "Failed to mark messages as read";
        });
      }
    },

    setCurrentConversation: (conversation) =>
      set((state) => {
        state.currentConversation = conversation;
      }),

    addMessage: (message) =>
      set((state) => {
        state.messages.push(message);

        const conversation = state.conversations.find((c) => c.id === message.conversationId);
        if (conversation) {
          conversation.lastMessage = {
            content: message.content,
            senderId: message.senderId,
            messageType: message.messageType,
            createdAt: message.createdAt,
          };
          conversation.lastMessageAt = message.createdAt;

          // Note: You might need to check against current user ID here
          if (!message.isRead) {
            conversation.unreadCount += 1;
          }
        }
      }),

    updateMessage: (messageId, updates) =>
      set((state) => {
        const messageIndex = state.messages.findIndex((m) => m.id === messageId);
        if (messageIndex !== -1) {
          Object.assign(state.messages[messageIndex], updates);
        }
      }),

    clearError: () =>
      set((state) => {
        state.loading.error = null;
        state.sendingMessage.error = null;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

export const useConversationsList = () => useMessagesStore((state) => state.conversations);
export const useCurrentConversation = () => useMessagesStore((state) => state.currentConversation);
export const useMessagesList = () => useMessagesStore((state) => state.messages);
export const useMessagesLoading = () => useMessagesStore((state) => state.loading.isLoading);
export const useSendingMessage = () => useMessagesStore((state) => state.sendingMessage.isLoading);
export const useMessagesError = () => useMessagesStore((state) => state.loading.error);
