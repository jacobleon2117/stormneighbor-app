// File: frontend/App.js
import { StatusBar } from "expo-status-bar";
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  // If user is authenticated but needs profile setup
  if (needsProfileSetup) {
    return (
      <ProfileSetupFlow
        onSetupComplete={completeProfileSetup}
        onBack={() => {
          // Don't allow going back after successful registration
          console.log("Profile setup back pressed - staying in setup");
        }}
      />
    );
  }

  return <MainApp user={user} />;
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <AppContent />
    </AuthProvider>
  );
}
