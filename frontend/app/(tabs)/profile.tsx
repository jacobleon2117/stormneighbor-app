import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Button } from "../../components/UI/Button";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
        
        <Button 
          title="Logout" 
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 24,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  logoutButton: {
    marginTop: 20,
    minWidth: 120,
  },
});
