import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button } from "../../components/UI/Button";
import { Input } from "../../components/UI/Input";
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import TempNotificationService from "../../services/tempNotifications";
import { Header } from "../../components/UI/Header";
import { TestTube, MessageSquare } from "lucide-react-native";

type EditMode = "personal" | "location" | "notifications" | "security" | null;

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  email: string;
}

interface LocationForm {
  address: string;
  locationCity: string;
  addressState: string;
  zipCode: string;
  locationRadiusMiles: number;
  showCityOnly: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  emergencyAlerts: boolean;
  weatherAlerts: boolean;
  communityUpdates: boolean;
  postReactions: boolean;
  comments: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });

  const [locationForm, setLocationForm] = useState<LocationForm>({
    address: user?.address || "",
    locationCity: user?.locationCity || "",
    addressState: user?.addressState || "",
    zipCode: user?.zipCode || "",
    locationRadiusMiles: user?.locationRadiusMiles || 5,
    showCityOnly: user?.showCityOnly || false,
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: user?.notificationPreferences?.emailNotifications || true,
    pushNotifications: user?.notificationPreferences?.pushNotifications || true,
    emergencyAlerts: user?.notificationPreferences?.emergencyAlerts || true,
    weatherAlerts: user?.notificationPreferences?.weatherAlerts || true,
    communityUpdates: user?.notificationPreferences?.communityUpdates || false,
    postReactions: user?.notificationPreferences?.postReactions || false,
    comments: user?.notificationPreferences?.comments || false,
    quietHoursEnabled: user?.notificationPreferences?.quietHoursEnabled || false,
    quietHoursStart: user?.notificationPreferences?.quietHoursStart || "22:00",
    quietHoursEnd: user?.notificationPreferences?.quietHoursEnd || "07:00",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || "",
        bio: user.bio || "",
        email: user.email,
      });

      setLocationForm({
        address: user.address || "",
        locationCity: user.locationCity || "",
        addressState: user.addressState || "",
        zipCode: user.zipCode || "",
        locationRadiusMiles: user.locationRadiusMiles || 5,
        showCityOnly: user.showCityOnly,
      });

      setNotificationPrefs({
        emailNotifications: user.notificationPreferences?.emailNotifications ?? true,
        pushNotifications: user.notificationPreferences?.pushNotifications ?? true,
        emergencyAlerts: user.notificationPreferences?.emergencyAlerts ?? true,
        weatherAlerts: user.notificationPreferences?.weatherAlerts ?? true,
        communityUpdates: user.notificationPreferences?.communityUpdates ?? false,
        postReactions: user.notificationPreferences?.postReactions ?? false,
        comments: user.notificationPreferences?.comments ?? false,
        quietHoursEnabled: user.notificationPreferences?.quietHoursEnabled ?? false,
        quietHoursStart: user.notificationPreferences?.quietHoursStart || "22:00",
        quietHoursEnd: user.notificationPreferences?.quietHoursEnd || "07:00",
      });
    }
  }, [user]);

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

  const handleSavePersonal = async () => {
    try {
      setLoading(true);

      const response = await apiService.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        bio: profileForm.bio,
      });

      if (response.success) {
        Alert.alert("Success", "Profile updated successfully!");
        setEditMode(null);
        const profileResponse = await apiService.getProfile();
        if (profileResponse.success) {
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setLoading(true);

      const response = await apiService.updateProfile({
        address: locationForm.address,
        locationCity: locationForm.locationCity,
        addressState: locationForm.addressState,
        zipCode: locationForm.zipCode,
        locationRadiusMiles: locationForm.locationRadiusMiles,
        showCityOnly: locationForm.showCityOnly,
      });

      if (response.success) {
        Alert.alert("Success", "Location settings updated successfully!");
        setEditMode(null);
      }
    } catch (error: any) {
      console.error("Error updating location:", error);
      Alert.alert("Error", "Failed to update location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);

      const response = await apiService.updateNotificationPreferences(notificationPrefs);

      if (response.success) {
        Alert.alert("Success", "Notification preferences updated successfully!");
        setEditMode(null);
      }
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      Alert.alert("Error", "Failed to update notification preferences. Please try again.");
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

  const renderPersonalModal = () => (
    <Modal visible={editMode === "personal"} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditMode(null)}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Personal Information</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="First Name"
            value={profileForm.firstName}
            onChangeText={(firstName) => setProfileForm((prev) => ({ ...prev, firstName }))}
            required
          />

          <Input
            label="Last Name"
            value={profileForm.lastName}
            onChangeText={(lastName) => setProfileForm((prev) => ({ ...prev, lastName }))}
            required
          />

          <Input
            label="Phone Number"
            value={profileForm.phone}
            onChangeText={(phone) => setProfileForm((prev) => ({ ...prev, phone }))}
            keyboardType="phone-pad"
            placeholder="(555) 123-4567"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={profileForm.bio}
              onChangeText={(bio) => setProfileForm((prev) => ({ ...prev, bio }))}
              placeholder="Tell your neighbors a bit about yourself..."
              placeholderTextColor={Colors.text.disabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{profileForm.bio.length}/500</Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setEditMode(null)}
              variant="outline"
              size="large"
              style={styles.modalButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSavePersonal}
              loading={loading}
              disabled={!profileForm.firstName.trim() || !profileForm.lastName.trim()}
              size="large"
              style={styles.modalButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal visible={editMode === "location"} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditMode(null)}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Location Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Street Address"
            value={locationForm.address}
            onChangeText={(address) => setLocationForm((prev) => ({ ...prev, address }))}
            placeholder="123 Main St"
          />

          <View style={styles.row}>
            <Input
              label="City"
              value={locationForm.locationCity}
              onChangeText={(locationCity) =>
                setLocationForm((prev) => ({ ...prev, locationCity }))
              }
              required
              containerStyle={{ flex: 2, marginRight: 8 }}
            />
            <Input
              label="State"
              value={locationForm.addressState}
              onChangeText={(addressState) =>
                setLocationForm((prev) => ({ ...prev, addressState }))
              }
              placeholder="CA"
              maxLength={2}
              required
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <Input
            label="ZIP Code"
            value={locationForm.zipCode}
            onChangeText={(zipCode) => setLocationForm((prev) => ({ ...prev, zipCode }))}
            keyboardType="numeric"
            maxLength={5}
            placeholder="90210"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notification Radius (miles)</Text>
            <Input
              value={locationForm.locationRadiusMiles.toString()}
              onChangeText={(value) =>
                setLocationForm((prev) => ({
                  ...prev,
                  locationRadiusMiles: parseInt(value) || 5,
                }))
              }
              keyboardType="numeric"
              placeholder="5"
            />
            <Text style={styles.helpText}>
              You'll receive notifications for posts within this distance
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Show City Only</Text>
              <Text style={styles.switchDescription}>
                Hide your exact address and only show city/state
              </Text>
            </View>
            <Switch
              value={locationForm.showCityOnly}
              onValueChange={(showCityOnly) =>
                setLocationForm((prev) => ({ ...prev, showCityOnly }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[300],
              }}
              thumbColor={locationForm.showCityOnly ? Colors.primary[500] : Colors.neutral[500]}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setEditMode(null)}
              variant="outline"
              size="large"
              style={styles.modalButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSaveLocation}
              loading={loading}
              disabled={!locationForm.locationCity.trim() || !locationForm.addressState.trim()}
              size="large"
              style={styles.modalButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderNotificationModal = () => (
    <Modal
      visible={editMode === "notifications"}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditMode(null)}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Push Notifications</Text>
              <Text style={styles.switchDescription}>Receive notifications on your device</Text>
            </View>
            <Switch
              value={notificationPrefs.pushNotifications}
              onValueChange={(pushNotifications) =>
                setNotificationPrefs((prev) => ({ ...prev, pushNotifications }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[300],
              }}
              thumbColor={
                notificationPrefs.pushNotifications ? Colors.primary[500] : Colors.neutral[500]
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Email Notifications</Text>
              <Text style={styles.switchDescription}>Receive important updates via email</Text>
            </View>
            <Switch
              value={notificationPrefs.emailNotifications}
              onValueChange={(emailNotifications) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  emailNotifications,
                }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[300],
              }}
              thumbColor={
                notificationPrefs.emailNotifications ? Colors.primary[500] : Colors.neutral[500]
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Emergency Alerts</Text>
              <Text style={styles.switchDescription}>Critical safety notifications</Text>
            </View>
            <Switch
              value={notificationPrefs.emergencyAlerts}
              onValueChange={(emergencyAlerts) =>
                setNotificationPrefs((prev) => ({ ...prev, emergencyAlerts }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.error[300],
              }}
              thumbColor={
                notificationPrefs.emergencyAlerts ? Colors.error[600] : Colors.neutral[500]
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Weather Alerts</Text>
              <Text style={styles.switchDescription}>Severe weather warnings</Text>
            </View>
            <Switch
              value={notificationPrefs.weatherAlerts}
              onValueChange={(weatherAlerts) =>
                setNotificationPrefs((prev) => ({ ...prev, weatherAlerts }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[300],
              }}
              thumbColor={
                notificationPrefs.weatherAlerts ? Colors.primary[500] : Colors.neutral[500]
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Community Updates</Text>
              <Text style={styles.switchDescription}>General community posts and updates</Text>
            </View>
            <Switch
              value={notificationPrefs.communityUpdates}
              onValueChange={(communityUpdates) =>
                setNotificationPrefs((prev) => ({ ...prev, communityUpdates }))
              }
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[300],
              }}
              thumbColor={
                notificationPrefs.communityUpdates ? Colors.primary[500] : Colors.neutral[500]
              }
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setEditMode(null)}
              variant="outline"
              size="large"
              style={styles.modalButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSaveNotifications}
              loading={loading}
              size="large"
              style={styles.modalButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderProfileHeader()}

        <View style={styles.menuSection}>
          {renderMenuItem("person", "Personal Information", "Name, phone, bio", () =>
            setEditMode("personal")
          )}

          {renderMenuItem(
            "location",
            "Location Settings",
            "Address, city, notification radius",
            () => setEditMode("location")
          )}

          {renderMenuItem(
            "notifications",
            "Notifications",
            "Push, email, and alert preferences",
            () => setEditMode("notifications")
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

          {__DEV__ &&
            renderMenuItem(
              TestTube,
              "Test Notification",
              "Test local notifications (temp Firebase fix)",
              async () => {
                const success = await TempNotificationService.sendTestNotification();
                Alert.alert(
                  success ? "Test Sent!" : "Test Failed",
                  success
                    ? "Check your notification bar! This is how alerts will appear."
                    : "Make sure you've enabled notifications for this app."
                );
              }
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

      {renderPersonalModal()}
      {renderLocationModal()}
      {renderNotificationModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
  },
  logoutButton: {
    alignSelf: "center",
    minWidth: 120,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "right",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  modalButton: {
    flex: 1,
  },
});
