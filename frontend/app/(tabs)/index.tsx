import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Search, X } from "lucide-react-native";
import { PostCard } from "../../components/Posts/PostCard";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";
import { Post, SearchFilters } from "../../types";
import { Colors } from "../../constants/Colors";
import { URL_CONFIG } from "../../constants/config";
import { Button } from "../../components/UI/Button";
import { Header } from "../../components/UI/Header";

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    types: [],
    priorities: [],
    emergencyOnly: false,
    resolved: "all",
    sortBy: "date",
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { user } = useAuth();

  const fetchPosts = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setError(null);
      }

      const response = await apiService.getPosts({
        page: pageNum,
        limit: 20,
        city: user?.homeCity || user?.locationCity,
        state: user?.homeState || user?.addressState,
      });

      if (response.success && response.data) {
        const newPosts = response.data.posts || response.data;

        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        if (newPosts.length < 20) {
          setHasMore(false);
        }

        setPage(pageNum);
      } else {
        throw new Error(response.message || "Failed to load posts");
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load posts";

      if (pageNum === 1) {
        setError(errorMessage);
      } else {
        Alert.alert("Error", "Failed to load more posts");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchPosts(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && posts.length > 0) {
      setLoadingMore(true);
      fetchPosts(page + 1, false);
    }
  }, [loadingMore, hasMore, page, posts.length]);

  const handleLike = async (postId: number) => {
    try {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                userReaction: post.userReaction ? null : "like",
                likeCount: post.userReaction
                  ? (post.likeCount || 1) - 1
                  : (post.likeCount || 0) + 1,
              }
            : post
        )
      );

      const currentPost = posts.find((p) => p.id === postId);

      if (currentPost?.userReaction) {
        await apiService.getApi().delete(`/posts/${postId}/reactions`);
      } else {
        await apiService.getApi().post(`/posts/${postId}/reactions`, {
          reactionType: "like",
        });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                userReaction: post.userReaction ? null : "like",
                likeCount: post.userReaction
                  ? (post.likeCount || 1) - 1
                  : (post.likeCount || 0) + 1,
              }
            : post
        )
      );

      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
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
            console.error("Error sharing:", error);
          }
        },
      },
    ]);
  };

  const handlePostPress = (postId: number) => {
    router.push(`/post/${postId}`);
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
      console.error("Error checking conversations:", error);
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

  const handleSearch = async (query: string, filters?: SearchFilters) => {
    if (!query.trim() && !filters?.types?.length && !filters?.priorities?.length) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchActive(true);

      const response = await apiService.searchPosts(query.trim(), {
        ...searchFilters,
        ...filters,
        city: user?.homeCity || user?.locationCity,
        state: user?.homeState || user?.addressState,
      });

      if (response.success && response.data) {
        const results = response.data.posts || response.data;
        setSearchResults(results);

        if (query.trim()) {
          setRecentSearches((prev) => {
            const updated = [query.trim(), ...prev.filter((s) => s !== query.trim())].slice(0, 5);
            return updated;
          });
        }
      }
    } catch (error: any) {
      console.error("Search error:", error);
      Alert.alert("Search Error", "Failed to search posts. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts(1);
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayedSearch = setTimeout(() => {
        handleSearch(searchQuery, searchFilters);
      }, 500);
      return () => clearTimeout(delayedSearch);
    } else if (searchActive) {
      setSearchActive(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (params.newPost && params.refresh) {
      try {
        const newPost = JSON.parse(params.newPost as string);
        setPosts((currentPosts) => [newPost, ...currentPosts]);
        router.setParams({ newPost: undefined, refresh: undefined });
      } catch (error) {
        console.error("Error parsing new post:", error);
      }
    }
  }, [params.newPost, params.refresh]);

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPress={handlePostPress}
      onMessage={handleMessage}
      onReport={(postId) => console.log("Report post:", postId)}
      onBlock={(userId) => console.log("Block user:", userId)}
      onUnfollow={(userId) => console.log("Unfollow user:", userId)}
      onHide={(postId) => console.log("Hide post:", postId)}
      currentUserId={user?.id}
      isFollowing={false} // TODO: Implement following logic
    />
  );

  const handleSearchPress = () => {
    router.push("/(tabs)/search");
  };

  const handleMessagesPress = () => {
    router.push("/(tabs)/notifications");
  };

  const handleMorePress = () => {
    router.push("/(tabs)/profile");
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyMessage}>Be the first to share something with your community!</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

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
              <X size={24} color={Colors.text.primary} />
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

  if (loading && posts.length === 0) {
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
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={() => {
          if (searchActive && !searchLoading) {
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
          if (searchLoading && searchResults.length > 0) {
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
            refreshing={refreshing}
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
    alignItems: "center",
    justifyContent: "space-between",
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
