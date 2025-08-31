import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/(auth)/register");
  };

  const handleHaveAccount = () => {
    router.push("/(auth)/login");
  };

  return (
    <ImageBackground
      source={require("../../assets/welcome-screen-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.spacer} />
        </SafeAreaView>
        
        <View style={styles.bottomContainer}>
          <Text style={styles.appName}>StormNeighbor</Text>
          <Text style={styles.tagline}>Get real-time, local severe weather alerts and updates from your community.</Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleHaveAccount}
          >
            <Text style={styles.secondaryButtonText}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 68,
    alignItems: 'center',
    maxHeight: screenHeight * 0.65,
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
    marginBottom: 44,
    lineHeight: 22,
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
    width: '100%',
    marginBottom: 16,
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
    width: '100%',
  },
  secondaryButtonText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "500",
  },
});
