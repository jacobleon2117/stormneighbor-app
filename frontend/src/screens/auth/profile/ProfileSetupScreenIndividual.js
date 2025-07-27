// File: frontend/src/screens/auth/profile/ProfileSetupScreenIndividual.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { User, Camera, ArrowRight } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const ProfileSetupScreenIndividual = ({ onNext, onBack, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileImage: initialData.profileImage || null,
    bio: initialData.bio || "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = () => {
    Alert.alert("Coming Soon", "Profile image upload will be available soon!");
  };

  const handleContinue = () => {
    if (onNext) {
      onNext(formData);
    }
  };

  const handleSkip = () => {
    if (onNext) {
      onNext({});
    }
  };

  return (
    <ScreenLayout showHeader={false} backgroundColor={colors.background}>
      <StandardHeader
        showBack={!!onBack}
        onBack={onBack}
        title="Profile Setup"
      />

      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        <View
          style={[
            globalStyles.center,
            { marginBottom: spacing.xl, marginTop: spacing.xl },
          ]}
        >
          <User size={32} color={colors.primary} />
          <Text
            style={[
              globalStyles.title,
              { marginTop: spacing.lg, marginBottom: spacing.md },
            ]}
          >
            Your Profile
          </Text>
          <Text style={[globalStyles.bodySecondary, { textAlign: "center" }]}>
            This information helps neighbors know who you are and builds trust
            within your community
          </Text>
        </View>

        <View style={[globalStyles.center, { marginBottom: spacing.xl }]}>
          <TouchableOpacity onPress={handleImagePicker}>
            {formData.profileImage ? (
              <Image
                source={{ uri: formData.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Camera size={24} color={colors.text.muted} />
                <Text style={[globalStyles.caption, { marginTop: spacing.sm }]}>
                  Add Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={globalStyles.label}>About You (Optional)</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                globalStyles.input,
                {
                  height: 120,
                  textAlignVertical: "top",
                  paddingTop: spacing.md,
                  paddingBottom: spacing.xl,
                },
              ]}
              value={formData.bio}
              onChangeText={(value) => updateField("bio", value)}
              placeholder="Tell your neighbors about yourself, your interests, or anything you'd like to share..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!loading}
            />
            <Text style={styles.characterCount}>{formData.bio.length}/500</Text>
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <TouchableOpacity
            style={[
              createButtonStyle("primary", "large"),
              loading && globalStyles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <View style={globalStyles.buttonContent}>
                <Text style={globalStyles.buttonPrimaryText}>Continue</Text>
                <ArrowRight size={20} color={colors.text.inverse} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createButtonStyle("secondary", "large"),
              { marginTop: spacing.md },
            ]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={globalStyles.buttonSecondaryText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  profileImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  characterCount: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.md,
    fontSize: 12,
    color: colors.text.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
    fontFamily: "Inter",
  },
};

export default ProfileSetupScreenIndividual;
