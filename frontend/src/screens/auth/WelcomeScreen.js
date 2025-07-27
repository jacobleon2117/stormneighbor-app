// File: frontend/src/screens/auth/WelcomeScreen.js
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const WelcomeScreen = ({ onGetStarted, onSignIn }) => {
  return (
    <ScreenLayout
      showHeader={false}
      scrollable={false}
      backgroundColor={colors.background}
      safeAreaBackground={colors.background}
    >
      <View
        style={[
          globalStyles.flex1,
          globalStyles.justifyCenter,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        {/* Logo and Title */}
        <View style={[globalStyles.center, { marginBottom: spacing.xxxxl }]}>
          <Text style={[globalStyles.title, styles.appTitle]}>
            Storm<Text style={{ color: colors.primary }}>Neighbor</Text>
          </Text>

          <Text
            style={[
              globalStyles.bodySecondary,
              { textAlign: "center", marginTop: spacing.lg },
            ]}
          >
            Connect with your community during weather emergencies and stay
            informed about local events
          </Text>
        </View>

        {/* Illustration */}
        <View style={[globalStyles.center, { marginBottom: spacing.xxxxl }]}>
          <Image
            source={require("../../../assets/images/illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={createButtonStyle("primary", "large")}
            onPress={onGetStarted}
          >
            <Text style={globalStyles.buttonPrimaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              { marginTop: spacing.md },
            ]}
            onPress={onSignIn}
          >
            <Text style={globalStyles.buttonSecondaryText}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  appTitle: {
    fontSize: 36,
    textAlign: "center",
    lineHeight: 44, // Ensure proper line height
  },

  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },

  buttonContainer: {
    marginBottom: spacing.xl,
  },
};

export default WelcomeScreen;
 