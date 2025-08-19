import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/Colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/(auth)/register");
  };

  const handleHaveAccount = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageSection}>
          <ImageBackground
            source={require("../../assets/bg-img.png")}
            style={styles.backgroundImage}
            resizeMode="contain"
            imageStyle={styles.backgroundImageStyle}
          />
        </View>

        <View style={styles.brandSection}>
          <Text style={styles.appName}>StormNeighbor</Text>
          <Text style={styles.tagline}>Your community connection hub</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Let's get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleHaveAccount}
          >
            <Text style={styles.secondaryButtonText}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 50,
  },
  imageSection: {
    height: 200,
    marginBottom: 20,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 40,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  backgroundImageStyle: {
    width: "100%",
    height: "100%",
  },
  actionSection: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    height: 47,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "500",
  },
});
