import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { User, Camera, ArrowRight, ArrowLeft } from "lucide-react-native";

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
    // TODO: Implement image picker
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wrapper}>
          {/* Back Button */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.stepContainer}>
              <View style={styles.stepContent}>
                <View style={styles.header}>
                  <User size={32} color="#3B82F6" />
                  <Text style={styles.title}>Your Profile</Text>
                  <Text style={styles.subtitle}>
                    Tell your neighbors a bit about yourself
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  {/* Profile Image */}
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handleImagePicker}
                    >
                      {formData.profileImage ? (
                        <Image
                          source={{ uri: formData.profileImage }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Camera size={24} color="#9CA3AF" />
                          <Text style={styles.imageText}>Add Photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Bio */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>About You (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.bio}
                      onChangeText={(value) => updateField("bio", value)}
                      placeholder="Tell your neighbors about yourself, your interests, or anything you'd like to share..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Navigation */}
            <View style={styles.navigation}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Continue</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  wrapper: {
    flex: 1,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 40,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepContent: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
  formContainer: {
    width: "100%",
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "Inter",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  imageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
    fontFamily: "Inter",
    marginTop: 4,
  },
  navigation: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Inter",
  },
});

export default ProfileSetupScreenIndividual;
