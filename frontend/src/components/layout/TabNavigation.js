// File: frontend/src/components/layout/TabNavigation.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Home, Cloud, Plus, AlertTriangle, User } from "lucide-react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";

const TabNavigation = ({ activeTab, onTabPress, alertCounts = {} }) => {
  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
    },
    {
      id: "weather",
      label: "Weather",
      icon: Cloud,
    },
    {
      id: "create",
      label: "Post",
      icon: Plus,
      isCreateButton: true,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: AlertTriangle,
      badge: typeof alertCounts.total === "number" ? alertCounts.total : 0,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
  ];

  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    const IconComponent = tab.icon;

    if (tab.isCreateButton) {
      return (
        <TouchableOpacity
          key={tab.id}
          style={styles.createButton}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <View style={styles.createButtonCircle}>
            <IconComponent size={18} color={colors.text.inverse} />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => onTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <View style={{ position: "relative" }}>
          <IconComponent
            size={18}
            color={isActive ? colors.primary : colors.text.muted}
          />

          {typeof tab.badge === "number" && tab.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tab.badge > 99 ? "99+" : String(tab.badge)}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>{tabs.map(renderTab)}</View>
    </View>
  );
};

const styles = {
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 34,
  },

  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    height: 64,
    zIndex: 2,
    ...globalStyles.card,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.muted,
    marginTop: spacing.xs / 2,
    fontFamily: "Inter",
  },

  tabLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },

  createButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },

  createButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },

  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter",
  },
};

export default TabNavigation;
