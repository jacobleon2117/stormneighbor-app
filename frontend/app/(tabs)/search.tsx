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
      setSearchResults(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, userReaction: post.userReaction ? null : "like" }
            : post
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

  return (
    <View style={styles.container}>
      <Header
        title="Search"
        showBackButton={true}
        onBackPress={() => router.back()}
        showSearch={false}
        showNotifications={false}
        showMessages={false}
        showMore={false}
        customRightContent={
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Filter size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <SafeAreaView style={styles.safeContent}>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.text.disabled} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            placeholder="Search posts, requests, updates..."
            placeholderTextColor={Colors.text.disabled}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={20} color={Colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(searchFilters.types?.length || searchFilters.priorities?.length) ? (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersLabel}>Active filters:</Text>
          <View style={styles.filterChips}>
            {searchFilters.types?.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.activeFilterChip}
                onPress={() => toggleType(type)}
              >
                <Text style={styles.activeFilterChipText}>
                  {POST_TYPES.find(t => t.key === type)?.label}
                </Text>
                <X size={14} color={Colors.text.inverse} />
              </TouchableOpacity>
            ))}
            {searchFilters.priorities?.map(priority => (
              <TouchableOpacity
                key={priority}
                style={styles.activeFilterChip}
                onPress={() => togglePriority(priority)}
              >
                <Text style={styles.activeFilterChipText}>
                  {PRIORITIES.find(p => p.key === priority)?.label}
                </Text>
                <X size={14} color={Colors.text.inverse} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showFilters && (
        <View style={styles.filtersModal}>
          <View style={styles.modalOverlay} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Post Types</Text>
              <View style={styles.filterOptions}>
                {POST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.filterChip,
                      searchFilters.types?.includes(type.key) && styles.filterChipActive,
                    ]}
                    onPress={() => toggleType(type.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        searchFilters.types?.includes(type.key) && styles.filterChipTextActive,
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
                      searchFilters.priorities?.includes(priority.key) && styles.filterChipActive,
                    ]}
                    onPress={() => togglePriority(priority.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        searchFilters.priorities?.includes(priority.key) && styles.filterChipTextActive,
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background,
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
  activeFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary[600],
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
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
    color: Colors.primary[600],
    fontWeight: "500",
  },
});