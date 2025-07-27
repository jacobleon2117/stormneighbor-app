// File: frontend/src/screens/auth/LoadingScreen.js
import { View, Text } from "react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";

const LoadingScreen = () => {
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
          globalStyles.center,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        <Text style={styles.appTitle}>
          Storm<Text style={{ color: colors.primary }}>Neighbor</Text>
        </Text>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  appTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
    textAlign: "center",
    lineHeight: 44,
  },
};

export default LoadingScreen;
