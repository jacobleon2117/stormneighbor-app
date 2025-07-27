// File: frontend/src/components/layout/StandardHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  typography,
} from "@styles/designSystem";

const StandardHeader = ({
  title,
  showBack = false,
  onBack,
  actions = [],
  style,
  showDefaultActions = true, // New prop to control default icons
}) => {
  // Default action handlers
  const handleSearch = () => {
    Alert.alert("Search", "Search functionality coming soon!");
  };

  const handleMessages = () => {
    Alert.alert("Messages", "Messages functionality coming soon!");
  };

  const handleMoreOptions = () => {
    Alert.alert("More Options", "More options coming soon!");
  };

  // Default actions (search, messages, more)
  const defaultActions = [
    {
      icon: <Search size={24} color={colors.text.primary} />,
      onPress: handleSearch,
    },
    {
      icon: <MessageCircle size={24} color={colors.text.primary} />,
      onPress: handleMessages,
    },
    {
      icon: <MoreHorizontal size={24} color={colors.text.primary} />,
      onPress: handleMoreOptions,
    },
  ];

  // Combine custom actions with default actions
  const allActions = showDefaultActions
    ? [...actions, ...defaultActions]
    : actions;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}

        <Text
          style={[showBack ? styles.title : styles.titleNoBack]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {allActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={action.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {action.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
  },

  center: {
    // Removed - no longer using center section
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },

  titleNoBack: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },

  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default StandardHeader;
