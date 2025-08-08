// File: frontend/App.js
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text } from "react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { colors } from "./src/styles/designSystem";
import AuthFlow from "./src/screens/auth/AuthFlow";
import MainApp from "./src/screens/main/MainApp";
import LoadingScreen from "./src/screens/auth/LoadingScreen";
import ProfileSetupFlow from "./src/screens/auth/profile/ProfileSetupFlow";

const AppContent = () => {
  const {
    isAuthenticated,
    needsProfileSetup,
    loading,
    user,
    completeProfileSetup,
  } = useAuth();

  const [showTestUpload, setShowTestUpload] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  if (needsProfileSetup) {
    return (
      <ProfileSetupFlow
        onSetupComplete={completeProfileSetup}
        onBack={() => {
          console.log("Profile setup back pressed - staying in setup");
        }}
      />
    );
  }

  if (showTestUpload) {
    return <TestUploadScreen onBack={() => setShowTestUpload(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MainApp user={user} />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <AppContent />
    </AuthProvider>
  );
}
