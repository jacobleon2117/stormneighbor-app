// File: frontend/src/components/GreetingHeader.js
import { View, Text, StyleSheet } from "react-native";
import { AlertTriangle, Cloud, Bell, Sun } from "lucide-react-native";

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
    if (count <= 0) return null;

    return (
      <View style={[styles.notificationCard, { backgroundColor: bgColor }]}>
        <View style={styles.iconContainer}>{icon}</View>

        <View style={[styles.numberBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeNumber}>{count}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingLeft}>
        <Sun size={20} color="#F59E0B" style={styles.greetingIcon} />
        <Text style={styles.greetingText}>
          {getGreeting()}, {user?.firstName || "Neighbor"}
        </Text>
      </View>

      <View style={styles.notificationCards}>
        {renderNotificationCard(
          <AlertTriangle size={18} color="#EF4444" />,
          alertCounts.critical,
          "#FEE2E2",
          "#EF4444",
          "#EF4444"
        )}

        {renderNotificationCard(
          <Cloud size={18} color="#F59E0B" />,
          alertCounts.weather,
          "#FEF3C7",
          "#F59E0B",
          "#F59E0B"
        )}

        {renderNotificationCard(
          <Bell size={18} color="#3B82F6" />,
          alertCounts.community,
          "#DBEAFE",
          "#3B82F6",
          "#3B82F6"
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  greetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  greetingIcon: {
    marginRight: 8,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  notificationCards: {
    flexDirection: "row",
    gap: 8,
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
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default GreetingHeader;
