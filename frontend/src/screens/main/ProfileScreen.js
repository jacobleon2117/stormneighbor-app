// File: frontend/src/screens/main/ProfileScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Edit3,
  MapPin,
  Calendar,
  Camera,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@contexts/AuthContext";
import ScreenLayout from "@components/layout/ScreenLayout";
import { globalStyles, colors, spacing } from "@styles/designSystem";

const ProfileScreen = ({ user, onLogout }) => {
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            if (onLogout) onLogout();
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert("Coming Soon", "Profile editing will be available soon!");
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      "Coming Soon",
      "Profile picture upload will be available soon!"
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert("Coming Soon", "Notification settings will be available soon!");
  };

  const handlePrivacySettings = () => {
    Alert.alert("Coming Soon", "Privacy settings will be available soon!");
  };

  const handleHelp = () => {
    Alert.alert("Coming Soon", "Help center will be available soon!");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh user data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImage}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.profileImageImg}
            />
          ) : (
            <User size={40} color={colors.text.muted} />
          )}
        </View>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleChangeProfilePicture}
        >
          <Camera size={16} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}

        <View style={styles.userDetails}>
          {user?.neighborhoodName && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.text.muted} />
              <Text style={styles.detailText}>{user.neighborhoodName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Calendar size={14} color={colors.text.muted} />
            <Text style={styles.detailText}>
              Member since{" "}
              {new Date(user?.createdAt || Date.now()).getFullYear()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettingsSection = () => {
    const settingsItems = [
      {
        icon: Bell,
        title: "Notifications",
        subtitle: "Manage your notification preferences",
        onPress: handleNotificationSettings,
      },
      {
        icon: Shield,
        title: "Privacy & Security",
        subtitle: "Control your privacy settings",
        onPress: handlePrivacySettings,
      },
      {
        icon: HelpCircle,
        title: "Help & Support",
        subtitle: "Get help and contact support",
        onPress: handleHelp,
      },
    ];

    return (
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>Settings</Text>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingsItem,
              index === settingsItems.length - 1 && styles.settingsItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.settingsItemLeft}>
              <View style={styles.settingsIcon}>
                <item.icon size={20} color={colors.primary} />
              </View>
              <View style={styles.settingsText}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.text.muted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLogoutButton = () => (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <LogOut size={20} color={colors.error} />
      <Text style={styles.logoutText}>Sign Out</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout title="Profile" refreshing={refreshing} onRefresh={onRefresh}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderProfileHeader()}
          {renderSettingsSection()}
          {renderLogoutButton()}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },

  profileHeader: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...globalStyles.card,
  },

  profileImageContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
    position: "relative",
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },

  profileImageImg: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },

  profileInfo: {
    alignItems: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: "Inter",
  },

  editButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },

  userBio: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
    fontFamily: "Inter",
  },

  userDetails: {
    alignItems: "center",
    gap: spacing.xs,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  detailText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...globalStyles.card,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.lg,
    fontFamily: "Inter",
  },

  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  settingsItemLast: {
    borderBottomWidth: 0,
  },

  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  settingsText: {
    flex: 1,
  },

  settingsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
    fontFamily: "Inter",
  },

  settingsSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: "Inter",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.errorLight,
    ...globalStyles.card,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
    marginLeft: spacing.sm,
    fontFamily: "Inter",
  },
});

export default ProfileScreen;
