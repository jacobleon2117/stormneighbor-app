// File: frontend/src/screens/auth/LoadingScreen.js
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const LoadingScreen = () => {
  return (
    <ScreenLayout
      showHeader={false}
      scrollable={false}
      backgroundColor={colors.background}
    >
      <View
        style={[
          globalStyles.flex1,
          globalStyles.center,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
        </View>

        {/* App Name */}
        <Text
          style={[globalStyles.title, { fontSize: 36, marginTop: spacing.xl }]}
        >
          Storm<Text style={{ color: colors.primary }}>Neighbor</Text>
        </Text>

        {/* Loading Indicator */}
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: spacing.xxl }}
        />

        {/* Loading Text */}
        <Text
          style={[
            globalStyles.bodySecondary,
            { marginTop: spacing.lg, textAlign: "center" },
          ]}
        >
          Loading your neighborhood...
        </Text>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  logoContainer: {
    alignItems: "center",
  },

  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...globalStyles.card,
  },

  logoEmoji: {
    fontSize: 32,
    color: colors.text.inverse,
  },
};

export default LoadingScreen;
