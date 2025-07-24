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

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthInput,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

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
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<User size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Your Profile</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            This information helps neighbors know who you are and builds trust
            within your community
          </Text>
        }
      />

      {/* Profile Image Section */}
      <View style={[authStyles.alignCenter, authStyles.marginBottom24]}>
        <TouchableOpacity onPress={handleImagePicker}>
          {formData.profileImage ? (
            <Image
              source={{ uri: formData.profileImage }}
              style={profileImageStyles.image}
            />
          ) : (
            <View style={profileImageStyles.placeholder}>
              <Camera size={24} color={colors.text.muted} />
              <Text style={[authStyles.smallText, authStyles.marginTop8]}>
                Add Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bio Input with Character Count */}
      <AuthInput
        label={<Text style={authStyles.label}>About You (Optional)</Text>}
      >
        <View style={{ position: "relative" }}>
          <TextInput
            style={[authStyles.input, authStyles.textArea]}
            value={formData.bio}
            onChangeText={(value) => updateField("bio", value)}
            placeholder="Tell your neighbors about yourself, your interests, or anything you'd like to share..."
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={characterCountStyles.text}>
            {formData.bio.length}/500
          </Text>
        </View>
      </AuthInput>

      {/* Continue Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <Text style={authStyles.primaryButtonText}>Continue</Text>
              <ArrowRight size={20} color={colors.text.inverse} />
            </View>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={handleSkip}
        >
          <Text style={authStyles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </AuthButtons>
    </AuthLayout>
  );
};

// Custom styles only for profile image and character count
const profileImageStyles = {
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
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
};

const characterCountStyles = {
  text: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: colors.text.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
};

export default ProfileSetupScreenIndividual;
