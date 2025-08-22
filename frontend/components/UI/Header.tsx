import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  Search,
  MessageCircle,
  MoreHorizontal,
  ArrowLeft,
  X,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  showMessages?: boolean;
  showMore?: boolean;
  onSearchPress?: () => void;
  onMessagesPress?: () => void;
  onMorePress?: () => void;
  customRightContent?: React.ReactNode;
  backgroundColor?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  onBackPress?: () => void;
  onClosePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showSearch = true,
  showMessages = true,
  showMore = true,
  onSearchPress,
  onMessagesPress,
  onMorePress,
  customRightContent,
  backgroundColor = Colors.background,
  showBackButton = false,
  showCloseButton = false,
  onBackPress,
  onClosePress,
}) => {
  const renderLeftContent = () => {
    if (showBackButton && onBackPress) {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.iconButton} />;
  };

  const renderRightContent = () => {
    if (showCloseButton && onClosePress) {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={onClosePress}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      );
    }

    if (customRightContent) {
      return customRightContent;
    }

    return (
      <View style={styles.headerIcons}>
        {showSearch && (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <Search size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
        {showMessages && (
          <TouchableOpacity style={styles.iconButton} onPress={onMessagesPress}>
            <MessageCircle size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
        {showMore && (
          <TouchableOpacity style={styles.iconButton} onPress={onMorePress}>
            <MoreHorizontal size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <SafeAreaView>
        <View style={styles.headerContent}>
          {renderLeftContent()}
          <Text style={styles.title}>{title}</Text>
          {renderRightContent()}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
});
