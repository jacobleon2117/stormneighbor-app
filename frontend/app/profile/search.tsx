import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Search, ChevronRight, FileText, Bookmark, Settings, Clock } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Header } from "../../components/UI/Header";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/api";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  icon: any;
  action: () => void;
}

interface Post {
  id: number;
  title?: string;
  content: string;
  postType: string;
  createdAt: string;
}

export default function ProfileSearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const loadUserData = useCallback(async () => {
    try {
      if (user?.id) {
        const response = await apiService.getUserPosts(user.id);

        if (response.success && response.data?.posts) {
          setUserPosts(response.data.posts);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const profileItems: SearchResult[] = useMemo(
    () => [
      ...userPosts.map((post) => ({
        id: `post-${post.id}`,
        title: post.title || post.content.substring(0, 50) + "...",
        subtitle: `${post.postType.replace("_", " ")} • ${new Date(post.createdAt).toLocaleDateString()}`,
        section: "Your Posts",
        icon: FileText,
        action: () => router.push(`/post/${post.id}`),
      })),

      {
        id: "account-settings",
        title: "Account Settings",
        subtitle: "Manage your account preferences",
        section: "Settings",
        icon: Settings,
        action: () => router.push("/(tabs)/profile"),
      },
      {
        id: "saved-posts",
        title: "Saved Posts",
        subtitle: "View your bookmarked posts",
        section: "Content",
        icon: Bookmark,
        action: () => {
          router.push("/saved-posts" as any);
        },
      },
      {
        id: "activity-history",
        title: "Activity History",
        subtitle: "Your recent activity and interactions",
        section: "Activity",
        icon: Clock,
        action: () => {
          router.push("/(tabs)/profile");
        },
      },
    ],
    [userPosts]
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = profileItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.section.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profileItems]);

  const handleGoBack = () => {
    router.back();
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const IconComponent = item.icon || Search;

    return (
      <TouchableOpacity style={styles.resultItem} onPress={item.action}>
        <View style={styles.resultIcon}>
          <IconComponent size={20} color={Colors.primary[500]} />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
          <Text style={styles.resultSection}>{item.section}</Text>
        </View>
        <ChevronRight size={20} color={Colors.neutral[400]} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? "No results found" : "Search profile settings"}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? "Try different keywords or browse your profile settings"
          : "Search for settings like 'notifications', 'location', 'privacy', or any other profile option"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Search Settings" showBackButton={true} onBackPress={handleGoBack} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.text.disabled} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search profile settings..."
            placeholderTextColor={Colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  listContainer: {
    paddingTop: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  resultSection: {
    fontSize: 12,
    color: Colors.primary[500],
    fontWeight: "500",
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
