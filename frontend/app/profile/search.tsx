import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Search, ChevronRight } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Header } from "../../components/UI/Header";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  action: () => void;
}

export default function ProfileSearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const profileItems: SearchResult[] = [
    {
      id: "personal-info",
      title: "Personal Information",
      subtitle: "Edit your name, phone, and bio",
      section: "Profile",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "first-name",
      title: "First Name",
      subtitle: "Change your first name",
      section: "Personal",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "last-name",
      title: "Last Name",
      subtitle: "Change your last name",
      section: "Personal",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "phone",
      title: "Phone Number",
      subtitle: "Update your phone number",
      section: "Personal",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "bio",
      title: "Bio",
      subtitle: "Tell your neighbors about yourself",
      section: "Personal",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "location",
      title: "Location Settings",
      subtitle: "Update your address and notification radius",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "address",
      title: "Address",
      subtitle: "Change your street address",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "city",
      title: "City",
      subtitle: "Update your city",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "state",
      title: "State",
      subtitle: "Change your state",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "zip-code",
      title: "ZIP Code",
      subtitle: "Update your postal code",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "notification-radius",
      title: "Notification Radius",
      subtitle: "Set how far you want to receive alerts",
      section: "Location",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "privacy",
      title: "Show City Only",
      subtitle: "Hide your exact address from other users",
      section: "Privacy",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "notifications",
      title: "Notification Settings",
      subtitle: "Manage your alert preferences",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "push-notifications",
      title: "Push Notifications",
      subtitle: "Enable or disable push notifications",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "email-notifications",
      title: "Email Notifications",
      subtitle: "Manage email alert settings",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "emergency-alerts",
      title: "Emergency Alerts",
      subtitle: "Critical safety notifications",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "weather-alerts",
      title: "Weather Alerts",
      subtitle: "Severe weather warnings",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "community-updates",
      title: "Community Updates",
      subtitle: "General community posts",
      section: "Notifications",
      action: () => {
        router.back();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "security",
      title: "Privacy & Security",
      subtitle: "Account security settings",
      section: "Security",
      action: () => {
        router.back();
        router.push("/privacy-security");
      },
    },
    {
      id: "help",
      title: "Help & Support",
      subtitle: "Get help with your account",
      section: "Support",
      action: () => {
        router.back();
        router.push("/help-support");
      },
    },
    {
      id: "feedback",
      title: "App Feedback",
      subtitle: "Share your thoughts about the app",
      section: "Support",
      action: () => {
        router.back();
        router.push("/user-feedback");
      },
    },
  ];

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
  }, [searchQuery]);

  const handleGoBack = () => {
    router.back();
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={item.action}>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
        <Text style={styles.resultSection}>{item.section}</Text>
      </View>
      <ChevronRight size={20} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );

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
      <Header
        title="Search Settings"
        showBackButton={true}
        onBackPress={handleGoBack}
      />

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