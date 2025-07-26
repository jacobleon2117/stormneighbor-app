// File: frontend/src/components/common/GreetingHeader.js
import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle, Cloud, Bell, Sun } from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";

const GreetingHeader = ({ user, alertCounts = {} }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    if (hour >= 17) greeting = "Good Evening";
    return greeting;
  };

  const renderNotificationCard = (
    icon,
    count,
    bgColor,
    iconColor,
    badgeColor
  ) => {
    if (!count || count <= 0) return null;

    return (
      <View style={[styles.notificationCard, { backgroundColor: bgColor }]}>
        <View style={styles.iconContainer}>{icon}</View>

        <View style={[styles.numberBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeNumber}>
            {count > 99 ? "99+" : String(count)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingLeft}>
        <Sun size={20} color={colors.warning} style={styles.greetingIcon} />
        <Text style={styles.greetingText}>
          {getGreeting()}, {user?.firstName || "Neighbor"}
        </Text>
      </View>

      <View style={styles.notificationCards}>
        {renderNotificationCard(
          <AlertTriangle size={18} color={colors.error} />,
          alertCounts.critical,
          colors.errorLight,
          colors.error,
          colors.error
        )}

        {renderNotificationCard(
          <Cloud size={18} color={colors.warning} />,
          alertCounts.weather,
          colors.warningLight,
          colors.warning,
          colors.warning
        )}

        {renderNotificationCard(
          <Bell size={18} color={colors.primary} />,
          alertCounts.community,
          colors.primaryLight,
          colors.primary,
          colors.primary
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    ...globalStyles.card,
  },

  greetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  greetingIcon: {
    marginRight: spacing.sm,
  },

  greetingText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  notificationCards: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  notificationCard: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  numberBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeNumber: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Inter",
  },
};

export default GreetingHeader;
