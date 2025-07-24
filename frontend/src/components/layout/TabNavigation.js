// File: frontend/src/components/TabNavigation.js
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, Cloud, Plus, AlertTriangle, User } from "lucide-react-native";

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
            <IconComponent size={18} color="#FFFFFF" />
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
          <IconComponent size={18} color={isActive ? "#3B82F6" : "#6B7280"} />

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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 8,
    marginHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    height: 64,
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#3B82F6",
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
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 0,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default TabNavigation;
