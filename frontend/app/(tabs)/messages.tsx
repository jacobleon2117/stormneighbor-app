import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Conversation } from "../../types";

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.getConversations();

      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations(true);
  }, [fetchConversations]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return messageDate.toLocaleDateString();
  };

  const handleConversationPress = (conversation: Conversation) => {
    router.push({
      pathname: "/conversation/[id]" as any,
      params: {
        id: conversation.id,
        userName: `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`,
        userImage: conversation.otherUser.profileImageUrl || "",
      },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isFromCurrentUser = item.lastMessage?.senderId === user?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.otherUser.profileImageUrl ? (
            <Image source={{ uri: item.otherUser.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.otherUser.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.otherUser.firstName} {item.otherUser.lastName}
            </Text>
            <Text style={styles.timestamp}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.lastMessageContainer}>
            {item.lastMessage && (
              <Text
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && !isFromCurrentUser && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {isFromCurrentUser && "You: "}
                {item.lastMessage.messageType === "image" ? "Image" : item.lastMessage.content}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.conversationMeta}>
          {item.unreadCount > 0 && <View style={styles.unreadIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyMessage}>
        Start a conversation by messaging someone from their profile or a post!
      </Text>
    </View>
  );

  const handleGoBack = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Messages" showBackButton={true} onBackPress={handleGoBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Messages" showBackButton={true} onBackPress={handleGoBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load messages</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchConversations()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Messages" showBackButton={true} onBackPress={handleGoBack} />
      <View style={styles.safeContent}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          contentContainerStyle={[
            styles.listContainer,
            conversations.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
              tintColor={Colors.primary[500]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  listContainer: {
    paddingVertical: 8,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary[700],
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.error[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  unreadText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: "600",
  },
  conversationContent: {
    flex: 1,
    marginRight: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  lastMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  unreadMessage: {
    color: Colors.text.primary,
    fontWeight: "500",
  },
  conversationMeta: {
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
