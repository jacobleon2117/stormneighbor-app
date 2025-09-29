import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect } from "expo-router";
import { Search, X } from "lucide-react-native";
import { PostCard } from "../../components/Posts/PostCard";
import { useAuthUser } from "../../stores";
import {
  usePostsStore,
  usePostsList,
  usePostsLoading,
  usePostsRefreshing,
  usePostsLoadingMore,
  usePostsPagination,
  useSearchResults,
  usePostsSearching,
} from "../../stores";
import { Post, SearchFilters } from "../../types";
import { Colors } from "../../constants/Colors";
import { URL_CONFIG } from "../../constants/config";
import { apiService } from "../../services/api";
import { useErrorHandler, ErrorHandler } from "../../utils/errorHandler";
import { Button } from "../../components/UI/Button";
import { Header } from "../../components/UI/Header";

export default function HomeScreen() {
  const user = useAuthUser();
  const posts = usePostsList();
  const isLoading = usePostsLoading();
  const isRefreshing = usePostsRefreshing();
  const isLoadingMore = usePostsLoadingMore();
  const { fetchPosts, searchPosts, likePost, hidePost, setFilters, clearSearch } = usePostsStore();
  const errorHandler = useErrorHandler();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    types: [],
    priorities: [],
    emergencyOnly: false,
    resolved: "all",
    sortBy: "date",
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchResults = useSearchResults();
  const isSearching = usePostsSearching();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await fetchPosts({
      page: 1,
      isRefresh: true,
      city: user?.homeCity || user?.locationCity,
      state: user?.homeState || user?.addressState,
    });
  }, [fetchPosts, user]);

  const pagination = usePostsPagination();

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingMore && pagination.hasMore && posts.length > 0) {
      await fetchPosts({
        page: pagination.page + 1,
        city: user?.homeCity || user?.locationCity,
        state: user?.homeState || user?.addressState,
      });
    }
  }, [isLoadingMore, pagination.hasMore, pagination.page, posts.length, fetchPosts, user]);

  const handleLike = async (postId: number) => {
    await likePost(postId);
  };

  const handleComment = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = (postId: number) => {
    const shareUrl = `${URL_CONFIG.baseUrl}/post/${postId}`;
    const shareMessage = `Check out this post on StormNeighbor: ${shareUrl}`;

    Alert.alert("Share Post", "How would you like to share this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy Link",
        onPress: async () => {
          try {
            await Clipboard.setStringAsync(shareUrl);
            Alert.alert("Success", "Link copied to clipboard!");
          } catch (error) {
            Alert.alert("Error", "Failed to copy link");
          }
        },
      },
      {
        text: "More Options",
        onPress: async () => {
          try {
            await Share.share({
              message: shareMessage,
              url: shareUrl,
            });
          } catch (error) {
            ErrorHandler.silent(error as Error, "Share post");
          }
        },
      },
    ]);
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
      ErrorHandler.silent(error as Error, "Check conversations");
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

  const handleSearch = useCallback(
    async (query: string, filters?: SearchFilters) => {
      if (!query.trim() && !filters?.types?.length && !filters?.priorities?.length) {
        setSearchActive(false);
        clearSearch();
        return;
      }

      try {
        setSearchActive(true);
        await searchPosts(query.trim(), {
          ...searchFilters,
          ...filters,
          city: user?.homeCity || user?.locationCity,
          state: user?.homeState || user?.addressState,
        });

        if (query.trim()) {
          setRecentSearches((prev) => {
            const updated = [query.trim(), ...prev.filter((s) => s !== query.trim())].slice(0, 5);
            return updated;
          });
        }
      } catch (error: any) {
        errorHandler.handleError(error, "Search Posts");
      }
    },
    [searchFilters, user, searchPosts, clearSearch, errorHandler]
  );

  useEffect(() => {
    if (user) {
      fetchPosts({
        page: 1,
        city: user?.homeCity || user?.locationCity,
        state: user?.homeState || user?.addressState,
      });
    }
  }, [user, fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      if (user && !searchActive) {
        fetchPosts({
          page: 1,
          isRefresh: true,
          city: user?.homeCity || user?.locationCity,
          state: user?.homeState || user?.addressState,
        });
      }
    }, [user, searchActive, fetchPosts])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayedSearch = setTimeout(() => {
        handleSearch(searchQuery, searchFilters);
      }, 500);
      return () => clearTimeout(delayedSearch);
    } else if (searchActive) {
      setSearchActive(false);
      clearSearch();
    }
  }, [searchQuery, handleSearch, searchActive, searchFilters]);

  const handleReport = async (postId: number) => {
    Alert.alert("Report Post", "Why are you reporting this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Spam", onPress: () => submitReport(postId, "spam") },
      { text: "Inappropriate", onPress: () => submitReport(postId, "inappropriate") },
      { text: "Misleading", onPress: () => submitReport(postId, "misleading") },
      { text: "Other", onPress: () => submitReport(postId, "other") },
    ]);
  };

  const submitReport = async (postId: number, reason: string) => {
    try {
      await apiService.reportPost(postId, reason, "Reported from mobile app");
      Alert.alert("Reported", "Thank you for your report. We'll review this content.");
    } catch (error) {
      ErrorHandler.silent(error as Error, "Report post");
      Alert.alert("Error", "Failed to report post. Please try again.");
    }
  };

  const handleBlock = async (userId: number) => {
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user? You won't see their posts anymore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.blockUser(userId);
              Alert.alert("User Blocked", "The user has been blocked successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to block user. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleHide = async (postId: number) => {
    Alert.alert("Hide Post", "Hide this post from your feed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Hide",
        onPress: () => {
          hidePost(postId);
          Alert.alert("Hidden", "Post has been hidden from your feed.");
        },
      },
    ]);
  };

  const handleUnfollow = async (userId: number) => {
    Alert.alert("Unfollow User", "Stop following this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfollow",
        onPress: async () => {
          try {
            await apiService.unfollowUser(userId);
            Alert.alert("Success", "You are no longer following this user.");
          } catch (error) {
            Alert.alert("Error", "Failed to unfollow user. Please try again.");
          }
        },
      },
    ]);
  };

  const handleEdit = async (postId: number) => {
    router.push(`/post/${postId}/edit`);
  };

  const handleSave = async (postId: number) => {
    try {
      const response = await apiService.savePost(postId);

      if (response.success) {
        Alert.alert("Saved", "Post has been bookmarked to your saved posts.");
      } else {
        throw new Error(response.message || "Failed to save post");
      }
    } catch (error: any) {
      ErrorHandler.silent(error as Error, "Save post");
      Alert.alert("Error", "Failed to save post. Please try again.");
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onMessage={handleMessage}
      onReport={handleReport}
      onBlock={handleBlock}
      onUnfollow={handleUnfollow}
      onHide={handleHide}
      onEdit={handleEdit}
      onSave={handleSave}
      currentUserId={user?.id}
      isFollowing={item.userId === user?.id}
    />
  );

  const handleSearchPress = () => {
    router.push("/(tabs)/search");
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyMessage}>Be the first to share something with your community!</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  };

  const renderFiltersModal = () => {
    const POST_TYPES = [
      { key: "help_request", label: "Help Request" },
      { key: "help_offer", label: "Help Offer" },
      { key: "lost_found", label: "Lost & Found" },
      { key: "safety_alert", label: "Safety Alert" },
      { key: "general", label: "General" },
    ];

    const PRIORITIES = [
      { key: "low", label: "Low" },
      { key: "normal", label: "Normal" },
      { key: "high", label: "High" },
      { key: "urgent", label: "Urgent" },
    ];

    const SORT_OPTIONS = [
      { key: "date", label: "Most Recent" },
      { key: "relevance", label: "Most Relevant" },
      { key: "popularity", label: "Most Popular" },
    ];

    const toggleType = (type: string) => {
      const currentTypes = searchFilters.types || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      setSearchFilters((prev) => ({ ...prev, types: newTypes }));
    };

    const togglePriority = (priority: string) => {
      const currentPriorities = searchFilters.priorities || [];
      const newPriorities = currentPriorities.includes(priority)
        ? currentPriorities.filter((p) => p !== priority)
        : [...currentPriorities, priority];
      setSearchFilters((prev) => ({ ...prev, priorities: newPriorities }));
    };

    const clearAllFilters = () => {
      setSearchFilters({
        types: [],
        priorities: [],
        emergencyOnly: false,
        resolved: "all",
        sortBy: "date",
      });
    };

    return (
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={22} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Post Types</Text>
              <View style={styles.filterOptions}>
                {POST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.filterChip,
                      (searchFilters.types || []).includes(type.key) && styles.filterChipActive,
                    ]}
                    onPress={() => toggleType(type.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        (searchFilters.types || []).includes(type.key) &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Priority</Text>
              <View style={styles.filterOptions}>
                {PRIORITIES.map((priority) => (
                  <TouchableOpacity
                    key={priority.key}
                    style={[
                      styles.filterChip,
                      (searchFilters.priorities || []).includes(priority.key) &&
                        styles.filterChipActive,
                    ]}
                    onPress={() => togglePriority(priority.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        (searchFilters.priorities || []).includes(priority.key) &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterChip,
                      searchFilters.sortBy === option.key && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        sortBy: option.key as any,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        searchFilters.sortBy === option.key && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Apply Filters"
                onPress={() => {
                  setShowFilters(false);
                  handleSearch(searchQuery, searchFilters);
                }}
                size="large"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (isLoading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load posts</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentData = searchActive ? searchResults : posts;

  return (
    <View style={styles.container}>
      <Header
        title="Home"
        showSearch={true}
        showNotifications={true}
        showMessages={true}
        onSearchPress={handleSearchPress}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onMessagesPress={() => router.push("/(tabs)/messages")}
      />

      <FlatList
        data={currentData}
        renderItem={renderPost}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `post-${index}`)}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={() => {
          if (searchActive && !isSearching) {
            return (
              <View style={styles.emptyContainer}>
                <Search size={64} color={Colors.neutral[400]} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyMessage}>Try adjusting your search terms or filters</Text>
                {recentSearches.length > 0 && (
                  <View style={styles.recentSearches}>
                    <Text style={styles.recentSearchesTitle}>Recent Searches:</Text>
                    <View style={styles.recentSearchesContainer}>
                      {recentSearches.map((search, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.recentSearchChip}
                          onPress={() => {
                            setSearchQuery(search);
                            handleSearch(search, searchFilters);
                          }}
                        >
                          <Text style={styles.recentSearchText}>{search}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          }
          return renderEmpty();
        }}
        ListFooterComponent={() => {
          if (isSearching && searchResults.length > 0) {
            return (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            );
          }
          return searchActive ? null : renderFooter();
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={
              searchActive ? () => handleSearch(searchQuery, searchFilters) : handleRefresh
            }
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
        onEndReached={searchActive ? undefined : handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      {renderFiltersModal()}
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
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  recentSearches: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  recentSearchesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  recentSearchChip: {
    backgroundColor: Colors.primary[50],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentSearchText: {
    fontSize: 14,
    color: Colors.primary[700],
    fontWeight: "500",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  clearFiltersText: {
    fontSize: 16,
    color: Colors.primary[500],
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
  },
  modalActions: {
    paddingVertical: 24,
  },
});
