// File: frontend/src/screens/auth/profile/ProfileSetupScreenIndividual.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { User, ArrowRight } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import ImagePicker from "@components/common/ImagePicker";

const ProfileSetupScreenIndividual = ({ onNext, onBack, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profileImage: initialData.profileImage || null,
    bio: initialData.bio || "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUploaded = (imageUrl, uploadData) => {
    console.log("Profile image uploaded during setup:", imageUrl);
    updateField("profileImage", imageUrl);
    Alert.alert("Success", "Profile image uploaded successfully!");
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <ScreenLayout
      title="Profile Setup"
      showHeader={true}
      headerActions={[]}
      showDefaultActions={false}
      scrollable={true}
      backgroundColor={colors.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <User size={32} color={colors.primary} />
          <Text style={globalStyles.title}>Your Profile</Text>
          <Text style={globalStyles.bodySecondary}>
            This information helps neighbors know who you are and builds trust
            within your community
          </Text>
        </View>

        <View style={styles.imageSection}>
          <ImagePicker
            currentImageUrl={formData.profileImage}
            onImageUploaded={handleImageUploaded}
            size={120}
            placeholder="Add Profile Photo"
            showUploadButton={false}
          />
          <Text style={styles.imageHint}>Tap to add a profile photo</Text>
        </View>

        <View style={styles.formCard}>
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

        <View style={styles.buttonGroup}>
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

        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={[globalStyles.link, { textAlign: "center" }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = {
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  imageSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  imageHint: {
    ...globalStyles.caption,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  formCard: {
    ...globalStyles.card,
    marginBottom: spacing.xl,
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

  buttonGroup: {
    marginBottom: spacing.lg,
  },

  backButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
};

export default ProfileSetupScreenIndividual;
