// File: frontend/src/screens/main/WeatherScreen.js
import { View, StyleSheet } from "react-native";
import TopNav from "@components/layout/TopNav";

const WeatherScreen = ({ user }) => {
  return (
    <View style={styles.container}>
      <TopNav title="Weather" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
});

export default WeatherScreen;
