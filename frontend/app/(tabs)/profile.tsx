import React, {
  useState /* useEffect - Currently not being used, need to either use it or remove it (if needed later, uncomment) */,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { Header } from "../../components/UI/Header";
import { MessageSquare } from "lucide-react-native";
import { Button } from "../../components/UI/Button";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleUpdateProfileImage = async () => {
    Alert.alert("Update Profile Picture", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission Required", "Camera permission is required to take photos.");
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            aspect: [1, 1],
            allowsEditing: true,
          });

          if (!result.canceled && result.assets?.[0]) {
            await uploadProfileImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission Required",
              "Photo library permission is required to choose photos."
            );
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 0.8,
            aspect: [1, 1],
            allowsEditing: true,
          });

          if (!result.canceled && result.assets?.[0]) {
            await uploadProfileImage(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setLoading(true);
      const response = await apiService.uploadImage(imageUri, "profile");

      if (response.success) {
        const profileResponse = await apiService.getProfile();
        if (profileResponse.success) {
          Alert.alert("Success", "Profile picture updated successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileContent}>
        <TouchableOpacity onPress={handleUpdateProfileImage} style={styles.avatarContainer}>
          {user?.profileImageUrl && !imageError ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={Colors.neutral[600]} />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color={Colors.text.inverse} />
          </View>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.locationCity && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={Colors.text.secondary} />
              <Text style={styles.locationText}>
                {user.locationCity}, {user.addressState}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderMenuItem = (
    icon: string | React.ComponentType<any>,
    title: string,
    subtitle: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    iconProps?: any
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        {typeof icon === "string" ? (
          <Ionicons name={icon as any} size={24} color={Colors.primary[500]} />
        ) : (
          React.createElement(icon, { size: 24, color: Colors.primary[500], ...iconProps })
        )}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        showSearch={true}
        showNotifications={true}
        showMessages={true}
        onSearchPress={() => router.push("/profile/search")}
        onNotificationsPress={() => router.push("/(tabs)/notifications")}
        onMessagesPress={() => router.push("/(tabs)/messages")}
        showMore={false}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
      >
        {renderProfileHeader()}

        <View style={styles.menuSection}>
          {renderMenuItem("person", "Personal Information", "Name, phone, bio", () =>
            router.push("/personal-information")
          )}

          {renderMenuItem(
            "location",
            "Location Settings",
            "Address, city, notification radius",
            () => router.push("/location-settings")
          )}

          {renderMenuItem(
            "notifications",
            "Notifications",
            "Push, email, and alert preferences",
            () => router.push("/notification-settings")
          )}

          {renderMenuItem(
            "shield-checkmark",
            "Privacy & Security",
            "Account security settings",
            () => router.push("/privacy-security")
          )}

          {renderMenuItem("help-circle", "Help & Support", "FAQs, contact support", () =>
            router.push("/help-support")
          )}

          {renderMenuItem(
            MessageSquare,
            "App Feedback",
            "Share your thoughts to help improve the app",
            () => router.push("/user-feedback")
          )}
        </View>

        <View style={styles.dangerZone}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  safeContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: Colors.neutral[50],
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.neutral[200],
    marginBottom: 0,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  menuSection: {
    backgroundColor: Colors.background,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  dangerZone: {
    backgroundColor: Colors.background,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    alignSelf: "center",
    minWidth: 120,
  },
});
