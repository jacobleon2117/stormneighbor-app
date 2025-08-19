import { View, Text, StyleSheet } from "react-native";

export default function WeatherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather & Alerts</Text>
      <Text style={styles.subtitle}>Real-time weather information</Text>
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
