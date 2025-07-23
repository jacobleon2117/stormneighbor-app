// File path: frontend/src/screens/auth/profile/LocationSetupScreen.js

import React, { useState } from "react";
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
} from "react-native";
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react-native";

const LocationSetupScreen = ({ onNext, onBack, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.city.trim() || !formData.state.trim()) {
      Alert.alert("Required Fields", "Please enter your city and state");
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

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
                  <MapPin size={32} color="#3B82F6" />
                  <Text style={styles.title}>Your Location</Text>
                  <Text style={styles.subtitle}>
                    Help us connect you with your local community
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Street Address</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.address}
                      onChangeText={(value) => updateField("address", value)}
                      placeholder="Your address"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={[styles.inputContainer, { flex: 2 }]}>
                      <Text style={styles.label}>City</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.city}
                        onChangeText={(value) => updateField("city", value)}
                        placeholder="Your City"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        { flex: 1, marginLeft: 12 },
                      ]}
                    >
                      <Text style={styles.label}>State</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.state}
                        onChangeText={(value) => updateField("state", value)}
                        placeholder="TX"
                        placeholderTextColor="#9CA3AF"
                        maxLength={2}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Zip Code</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.zipCode}
                      onChangeText={(value) => updateField("zipCode", value)}
                      placeholder="Your zip code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={5}
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
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
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

export default LocationSetupScreen;
