// File: frontend/src/screens/main/ProfileScreen.js
import { View, StyleSheet } from "react-native";
import TopNav from "../../components/TopNav";

const ProfileScreen = ({ user, onLogout }) => {
  return (
    <View style={styles.container}>
      <TopNav title="Profile" showSearch={false} showMessages={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
});

export default ProfileScreen;
