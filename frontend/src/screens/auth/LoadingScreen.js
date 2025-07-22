import { View, Text, StyleSheet, SafeAreaView } from "react-native";

const LoadingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logoText}>
          Storm<Text style={styles.logoHighlight}>Neighbor</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  logoHighlight: {
    color: "#3B82F6",
  },
});

export default LoadingScreen;
