import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "../components/UI/Header";
import { Input } from "../components/UI/Input";
import { Button } from "../components/UI/Button";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { ErrorHandler } from "../utils/errorHandler";

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  email: string;
}

export default function PersonalInformationScreen() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleSavePersonal = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      Alert.alert("Error", "First name and last name are required.");
      return;
    }

    try {
      setLoading(true);
      await apiService.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        bio: profileForm.bio.trim(),
      });

      await refreshProfile();
      Alert.alert("Success", "Personal information updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      ErrorHandler.silent(error as Error, "Profile update error");
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { key: "firstName", label: "First Name", component: "input" },
    { key: "lastName", label: "Last Name", component: "input" },
    { key: "phone", label: "Phone Number", component: "input" },
    { key: "bio", label: "Bio", component: "input" },
    { key: "email", label: "Email", component: "input" },
  ];

  const renderField = (field: any) => {
    const commonProps = {
      label: field.label,
      value: profileForm[field.key as keyof ProfileForm],
      onChangeText: (value: string) => setProfileForm((prev) => ({ ...prev, [field.key]: value })),
    };

    if (field.key === "email") {
      return <Input {...commonProps} keyboardType="email-address" required />;
    }
    if (field.key === "phone") {
      return <Input {...commonProps} keyboardType="phone-pad" />;
    }
    if (field.key === "bio") {
      return <Input {...commonProps} multiline numberOfLines={3} />;
    }
    return (
      <Input {...commonProps} required={field.key === "firstName" || field.key === "lastName"} />
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Personal Information" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {formFields.map((field) => (
            <View key={field.key}>
              {field.key === "bio" ? (
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
              ) : field.key === "email" ? (
                <View style={styles.emailSection}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <Text style={styles.emailValue}>{profileForm.email}</Text>
                  <Text style={styles.emailNote}>Contact support to change your email address</Text>
                </View>
              ) : (
                renderField(field)
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.footerButton}
          disabled={loading}
        />
        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSavePersonal}
          loading={loading}
          disabled={!profileForm.firstName.trim() || !profileForm.lastName.trim()}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  section: {
    gap: 16,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral[50],
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "right",
    marginTop: 4,
  },
  emailSection: {
    marginTop: 8,
  },
  emailValue: {
    fontSize: 16,
    color: Colors.text.secondary,
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailNote: {
    fontSize: 12,
    color: Colors.text.disabled,
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerButton: {
    flex: 1,
    height: 48,
  },
});
