import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Search, Filter, X } from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { PostCard } from "../../components/Posts/PostCard";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { Post, SearchFilters } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const POST_TYPES = [
  { key: "help_request", label: "Help Request" },
  { key: "help_offer", label: "Help Offer" },
  { key: "lost_found", label: "Lost & Found" },
  { key: "safety_alert", label: "Safety Alert" },
  { key: "general", label: "General" },
];

const PRIORITIES = [
  { key: "urgent", label: "Urgent" },
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" },
];

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    types: [],
    priorities: [],
    emergencyOnly: false,
    resolved: "all",
    sortBy: "relevance",
  });

  const handleSearch = async (query: string, filters?: SearchFilters) => {
    if (!query.trim() && !filters?.types?.length && !filters?.priorities?.length) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.searchPosts(query.trim(), {
        ...searchFilters,
        ...filters,
        city: user?.homeCity || user?.locationCity,
        state: user?.homeState || user?.addressState,
      });

      if (response.success && response.data) {
        setSearchResults(response.data.items || []);
      } else {
        throw new Error(response.message || "Search failed");
      }
    } catch (error: any) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search posts. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await apiService.toggleCommentReaction(postId);
      setSearchResults((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, userReaction: post.userReaction ? null : "like" } : post
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
  };

  const handleComment = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = (postId: number) => {
    const shareUrl = `https://stormneighbor.app/post/${postId}`;
    Alert.alert("Share Post", shareUrl);
  };

  const handlePostPress = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const toggleType = (type: string) => {
    const currentTypes = searchFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    const newFilters = { ...searchFilters, types: newTypes };
    setSearchFilters(newFilters);
    handleSearch(searchQuery, newFilters);
  };

  const togglePriority = (priority: string) => {
    const currentPriorities = searchFilters.priorities || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];
    const newFilters = { ...searchFilters, priorities: newPriorities };
    setSearchFilters(newFilters);
    handleSearch(searchQuery, newFilters);
  };

  const clearAllFilters = () => {
    const newFilters: SearchFilters = {
      types: [],
      priorities: [],
      emergencyOnly: false,
      resolved: "all",
      sortBy: "relevance",
    };
    setSearchFilters(newFilters);
    handleSearch(searchQuery, newFilters);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onPress={handlePostPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? "No results found" : "Search StormNeighbor"}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : "Find posts, requests, and updates from your community"}
      </Text>
    </View>
  );

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header
        title="Search"
        showBackButton={true}
        onBackPress={handleGoBack}
        showSearch={false}
        showNotifications={false}
        showMessages={false}
        showMore={false}
      />

      <View style={{ flex: 1 }}></View>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  activeFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  activeFilterChipText: {
    fontSize: 12,
    color: Colors.text.inverse,
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
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
  filtersModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    marginTop: 100,
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: "80%",
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
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSectionTitle: {
    fontSize: 16,
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
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  clearAllButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  clearAllButtonText: {
    fontSize: 16,
    color: Colors.primary[500],
    fontWeight: "500",
  },
});
