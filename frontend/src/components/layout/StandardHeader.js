// File: frontend/src/components/layout/StandardHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
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
}) => {
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
      </View>

      <View style={styles.center}>
        <Text style={[globalStyles.heading, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {actions.map((action, index) => (
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
    minWidth: 40,
    justifyContent: "flex-start",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40,
    justifyContent: "flex-end",
  },

  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: "center",
  },

  backButton: {
    padding: spacing.xs,
  },

  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default StandardHeader;
