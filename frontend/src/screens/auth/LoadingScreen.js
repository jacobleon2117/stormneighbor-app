// File path: frontend/src/screens/auth/LoadingScreen.js
import { Text } from "react-native";
import AuthLayout from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

const LoadingScreen = () => {
  return (
    <AuthLayout scrollable={false}>
      <Text style={[authStyles.title, { fontSize: 36, fontWeight: "700" }]}>
        Storm<Text style={{ color: colors.primary }}>Neighbor</Text>
      </Text>
    </AuthLayout>
  );
};

export default LoadingScreen;
