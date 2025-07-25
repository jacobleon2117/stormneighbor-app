// File: frontend/App.js
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { colors } from "./src/styles/designSystem";
import AuthFlow from "./src/screens/auth/AuthFlow";
import MainApp from "./src/screens/main/MainApp";
import LoadingScreen from "./src/screens/auth/LoadingScreen";

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthFlow />;
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
