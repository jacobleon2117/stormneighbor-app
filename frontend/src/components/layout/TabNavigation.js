// File: frontend/src/components/TabNavigation.js
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
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
            <IconComponent size={20} color="#FFFFFF" />
          </View>
          {/* Removed post label text (testing UI) */}
          {/* <Text style={styles.createButtonLabel}>{tab.label}</Text> */}
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
          <IconComponent size={20} color={isActive ? "#3B82F6" : "#6B7280"} />

          {/* Badge for alerts */}
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabBar}>{tabs.map(renderTab)}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 74,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default TabNavigation;
