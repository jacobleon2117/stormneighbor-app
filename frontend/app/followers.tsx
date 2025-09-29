import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Users, Search, MessageCircle, UserMinus, UserPlus, X } from "lucide-react-native";
import { Header } from "../components/UI/Header";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { ErrorHandler } from "../utils/errorHandler";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export default function FollowersFollowingScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (params.tab as "followers" | "following") || "followers"
  );
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserData = useCallback(
    async (isRefresh: boolean = false) => {
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const [followersResponse, followingResponse] = await Promise.all([
          apiService.getFollowers(user?.id),
          apiService.getFollowing(user?.id),
        ]);

        if (followersResponse.success && followingResponse.success) {
          setFollowers(followersResponse.data?.followers || []);
          setFollowing(followingResponse.data?.following || []);
        } else {
          setError("Failed to load user data");
        }
      } catch (error: any) {
        ErrorHandler.silent(error as Error, "Failed to fetch user data");
        setError("Failed to load user data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(true);
  }, [fetchUserData]);

  const handleFollowToggle = async (userId: number, isCurrentlyFollowing: boolean) => {
    try {
      const action = isCurrentlyFollowing ? "Unfollow" : "Follow";

      Alert.alert(`${action} User`, `Are you sure you want to ${action.toLowerCase()} this user?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          onPress: async () => {
            try {
              if (isCurrentlyFollowing) {
                await apiService.unfollowUser(userId);
              } else {
                await apiService.followUser(userId);
              }

              await fetchUserData(true);

              Alert.alert(
                "Success",
                `You are now ${isCurrentlyFollowing ? "not following" : "following"} this user.`
              );
            } catch (error) {
              Alert.alert("Error", `Failed to ${action.toLowerCase()} user. Please try again.`);
            }
          },
        },
      ]);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Failed to toggle follow status");
    }
  };

  const handleMessage = async (userId: number, userName: string) => {
    try {
      const conversationsResponse = await apiService.getConversations();
      if (conversationsResponse.success && conversationsResponse.data) {
        const existingConversation = conversationsResponse.data.conversations.find(
          (conv: any) => conv.otherUser.id === userId
        );

        if (existingConversation) {
          router.push({
            pathname: "/conversation/[id]" as any,
            params: {
              id: existingConversation.id,
              userName: userName,
              userImage: existingConversation.otherUser.profileImageUrl || "",
            },
          });
          return;
        }
      }
    } catch (error) {
      ErrorHandler.silent(error as Error, "Failed to check existing conversations");
    }

    Alert.alert("Start Conversation", `Send a message to ${userName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Message",
        onPress: () => {
          router.push({
            pathname: "/conversation/new" as any,
            params: {
              recipientId: userId,
              recipientName: userName,
            },
          });
        },
      },
    ]);
  };

  const currentData = activeTab === "followers" ? followers : following;
  const filteredData = searchQuery
    ? currentData.filter((user) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentData;

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.firstName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          <Text style={styles.userStats}>
            {item.followersCount} followers • {item.followingCount} following
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => handleMessage(item.id, `${item.firstName} ${item.lastName}`)}
        >
          <MessageCircle size={16} color={Colors.primary[500]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.followButton, item.isFollowing && styles.followingButton]}
          onPress={() => handleFollowToggle(item.id, item.isFollowing || false)}
        >
          {item.isFollowing ? (
            <>
              <UserMinus size={16} color={Colors.text.secondary} />
              <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color={Colors.text.inverse} />
              <Text style={styles.followButtonText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Users size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>
        {activeTab === "followers" ? "No followers yet" : "Not following anyone yet"}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTab === "followers"
          ? "People who follow you will appear here."
          : "Users you follow will appear here. Start connecting with your neighbors!"}
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
          title={activeTab === "followers" ? "Followers" : "Following"}
          showBackButton={true}
          onBackPress={handleGoBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title={activeTab === "followers" ? "Followers" : "Following"}
          showBackButton={true}
          onBackPress={handleGoBack}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={activeTab === "followers" ? "Followers" : "Following"}
        showBackButton={true}
        onBackPress={handleGoBack}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.activeTab]}
          onPress={() => setActiveTab("followers")}
        >
          <Text style={[styles.tabText, activeTab === "followers" && styles.activeTabText]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => setActiveTab("following")}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.activeTabText]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.text.disabled} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <X size={20} color={Colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={[
          styles.listContainer,
          filteredData.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary[500],
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  userCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  userStats: {
    fontSize: 12,
    color: Colors.text.disabled,
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  messageButton: {
    width: 40,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary[500],
    borderRadius: 16,
    gap: 4,
  },
  followingButton: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.inverse,
  },
  followingButtonText: {
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
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
