import { View, Text, StyleSheet } from "react-native";

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Alerts</Text>
      <Text style={styles.subtitle}>Community safety notifications</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
});
