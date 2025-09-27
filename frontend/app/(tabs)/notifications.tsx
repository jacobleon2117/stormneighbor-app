import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Users,
  Trash2,
} from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";

interface Notification {
  id: number;
  type: "like" | "comment" | "mention" | "post_update" | "system" | "emergency";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedPostId?: number;
  relatedUserId?: number;
  priority: "low" | "normal" | "high" | "urgent";
}

const NOTIFICATION_ICONS = {
  like: { component: CheckCircle, color: Colors.success[500] },
  comment: { component: MessageSquare, color: Colors.primary[500] },
  mention: { component: Users, color: Colors.warning[500] },
  post_update: { component: Bell, color: Colors.primary[500] },
  system: { component: AlertCircle, color: Colors.neutral[500] },
  emergency: { component: AlertCircle, color: Colors.error[500] },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter] = useState<"all" | "unread">("all");

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await apiService.getNotifications();

      if (response.success && response.data) {
        setNotifications(response.data.items || []);
      } else {
        throw new Error(response.message || "Failed to load notifications");
      }
    } catch (error: any) {
      console.error("Load notifications error:", error);
      if (!isRefresh) {
        Alert.alert("Error", "Failed to load notifications. Please try again.");
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(true);
  }, []);

  useEffect(() => {
    loadNotifications();

    // Set up polling for real-time notifications
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error("Mark all as read error:", error);
      Alert.alert("Error", "Failed to mark all as read. Please try again.");
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error("Delete notification error:", error);
      Alert.alert("Error", "Failed to delete notification. Please try again.");
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.relatedPostId) {
      router.push(`/post/${notification.relatedPostId}`);
    } else if (notification.type === "system" || notification.type === "emergency") {
      Alert.alert(notification.title, notification.message);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(
    (notification) => filter === "all" || !notification.isRead
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const IconComponent = NOTIFICATION_ICONS[item.type]?.component || Bell;
    const iconColor = NOTIFICATION_ICONS[item.type]?.color || Colors.neutral[500];
    const isUrgent = item.priority === "urgent" || item.type === "emergency";

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard,
          isUrgent && styles.urgentCard,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          <IconComponent size={20} color={iconColor} />
          {!item.isRead && <View style={styles.unreadIndicator} />}
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              "Delete Notification",
              "Are you sure you want to delete this notification?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteNotification(item.id),
                },
              ]
            );
          }}
        >
          <Trash2 size={16} color={Colors.text.disabled} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {filter === "unread" ? (
        <BellOff size={48} color={Colors.text.disabled} />
      ) : (
        <Bell size={48} color={Colors.text.disabled} />
      )}
      <Text style={styles.emptyTitle}>
        {filter === "unread" ? "No unread notifications" : "No notifications"}
      </Text>
      <Text style={styles.emptyMessage}>
        {filter === "unread"
          ? "All caught up! Check back later for updates."
          : "We'll notify you when something important happens in your community."}
      </Text>
    </View>
  );

  const handleGoBack = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Notifications"
          showBackButton={true}
          onBackPress={handleGoBack}
          backgroundColor={Colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        showBackButton={true}
        onBackPress={handleGoBack}
        backgroundColor={Colors.background}
      />
      <View style={styles.safeContent}>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <Text style={styles.notificationCount}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <CheckCircle size={16} color={Colors.primary[500]} />
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContainer,
            filteredNotifications.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
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
    backgroundColor: Colors.neutral[50],
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary[50],
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  activeFilterTabText: {
    color: Colors.primary[500],
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllReadText: {
    fontSize: 12,
    color: Colors.primary[500],
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderColor: Colors.primary[200],
    backgroundColor: Colors.primary[25],
  },
  urgentCard: {
    borderColor: Colors.error[200],
    backgroundColor: Colors.error[25],
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    position: "relative",
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: "600",
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.disabled,
  },
  deleteButton: {
    padding: 4,
    opacity: 0.6,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  notificationCount: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary[50],
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary[500],
    marginLeft: 4,
  },
});
