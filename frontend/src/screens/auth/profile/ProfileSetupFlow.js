// File: frontend/src/screens/auth/profile/ProfileSetupFlow.js
import React, { useState } from "react";
import { Alert } from "react-native";
import LocationSetupScreen from "./LocationSetupScreen";
import ProfileSetupScreenIndividual from "./ProfileSetupScreenIndividual";
import NotificationsSetupScreen from "./NotificationsSetupScreen";
import { useAuth } from "@contexts/AuthContext";

const ProfileSetupFlow = ({ onSetupComplete, onBack }) => {
  const { updateProfile, completeProfileSetup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    location: {},
    profile: {},
    notifications: {},
  });

  const handleLocationNext = (locationData) => {
    setSetupData((prev) => ({
      ...prev,
      location: locationData,
    }));
    setCurrentStep(2);
  };

  const handleLocationBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleProfileNext = (profileData) => {
    setSetupData((prev) => ({
      ...prev,
      profile: profileData,
    }));
    setCurrentStep(3);
  };

  const handleProfileBack = () => {
    setCurrentStep(1);
  };

  const handleNotificationsComplete = async (notificationData) => {
    const finalSetupData = {
      ...setupData.location,
      ...setupData.profile,
      ...notificationData,
    };

    try {
      console.log("Completing profile setup with data:", finalSetupData);

      const result = await updateProfile(finalSetupData);

      if (result.success) {
        console.log("Profile update successful, completing setup...");

        // Mark setup as completed and update auth state
        await completeProfileSetup();

        // Seamlessly transition to main app
        console.log("Setup completed, calling onSetupComplete");
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        console.error("Profile setup failed:", result.error);
        Alert.alert(
          "Setup Error",
          result.error || "Failed to complete profile setup",
          [
            { text: "Try Again" },
            {
              text: "Skip",
              onPress: async () => {
                await completeProfileSetup();
                if (onSetupComplete) {
                  onSetupComplete();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Profile setup error:", error);
      Alert.alert("Setup Error", "Something went wrong during setup.", [
        { text: "Try Again" },
        {
          text: "Skip",
          onPress: async () => {
            await completeProfileSetup();
            if (onSetupComplete) {
              onSetupComplete();
            }
          },
        },
      ]);
    }
  };

  const handleNotificationsBack = () => {
    setCurrentStep(2);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LocationSetupScreen
            onNext={handleLocationNext}
            onBack={handleLocationBack}
            initialData={setupData.location}
          />
        );

      case 2:
        return (
          <ProfileSetupScreenIndividual
            onNext={handleProfileNext}
            onBack={handleProfileBack}
            initialData={setupData.profile}
          />
        );

      case 3:
        return (
          <NotificationsSetupScreen
            onComplete={handleNotificationsComplete}
            onBack={handleNotificationsBack}
            initialData={setupData.notifications}
          />
        );

      default:
        return (
          <LocationSetupScreen
            onNext={handleLocationNext}
            onBack={handleLocationBack}
            initialData={setupData.location}
          />
        );
    }
  };

  return renderCurrentStep();
};

export default ProfileSetupFlow;
