import React, {
  useState /* useEffect, useCallback - Currently not being used, need to either use it or remove it (if needed later, uncomment) */,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Conversation } from "../../types";

interface MessageSearchModalProps {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

interface RecentlyOpened {
  conversation: Conversation;
  timestamp: number;
}

export const MessageSearchModal: React.FC<MessageSearchModalProps> = ({
  visible,
  onClose,
  conversations,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyOpened, setRecentlyOpened] = useState<RecentlyOpened[]>([]);

  const suggestedConversations = [...conversations].sort((a, b) => {
    const aMessageCount = a.messageCount || 0;
    const bMessageCount = b.messageCount || 0;
    return bMessageCount - aMessageCount;
  });

  const filteredConversations = suggestedConversations.filter((conv) =>
    `${conv.otherUser.firstName} ${conv.otherUser.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (conversation: Conversation) => {
    const newRecentlyOpened: RecentlyOpened = {
      conversation,
      timestamp: Date.now(),
    };

    setRecentlyOpened((prev) => {
      const filtered = prev.filter((item) => item.conversation.id !== conversation.id);
      return [newRecentlyOpened, ...filtered].slice(0, 5);
    });

    onClose();
    onSelectConversation(conversation);
  };

  const renderConversationItem = ({ item }: { item: Conversation }, isRecent: boolean = false) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleSelectConversation(item)}
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
      </View>

      <View style={styles.conversationContent}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.otherUser.firstName} {item.otherUser.lastName}
        </Text>
        {isRecent ? (
          <Text style={styles.recentLabel}>Recently opened</Text>
        ) : (
          <Text style={styles.messageCount}>{item.messageCount || 0} messages</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentlyOpened = () => {
    if (recentlyOpened.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Opened</Text>
        <FlatList
          data={recentlyOpened.map((item) => item.conversation)}
          keyExtractor={(item) => `recent-${item.id}`}
          renderItem={(props) => renderConversationItem(props, true)}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderSuggested = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Suggested</Text>
      <FlatList
        data={searchQuery ? filteredConversations : suggestedConversations}
        keyExtractor={(item) => `suggested-${item.id}`}
        renderItem={(props) => renderConversationItem(props, false)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={48} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? "No conversations found" : "Search conversations"}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery ? "Try adjusting your search terms" : "Find conversations with your neighbors"}
      </Text>
    </View>
  );

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <View style={styles.safeHeader}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                <ArrowLeft size={22} color={Colors.text.primary} />
              </TouchableOpacity>

              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.disabled} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search conversations..."
                  placeholderTextColor={Colors.text.disabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                    <X size={20} color={Colors.text.disabled} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContent}>
            {renderRecentlyOpened()}
            {renderSuggested()}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeHeader: {
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
    marginTop: 8,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
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
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  searchContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.neutral[50],
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
    borderRadius: 12,
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
  conversationContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  messageCount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  recentLabel: {
    fontSize: 14,
    color: Colors.primary[600],
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
