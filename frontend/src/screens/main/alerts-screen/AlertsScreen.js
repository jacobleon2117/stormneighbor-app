// File: frontend/src/screens/main/AlertsScreen.js
import { View, StyleSheet } from "react-native";
import TopNav from "../../components/TopNav";

const AlertsScreen = ({ user, alertCounts }) => {
  return (
    <View style={styles.container}>
      <TopNav title="Alerts" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
});

export default AlertsScreen;
