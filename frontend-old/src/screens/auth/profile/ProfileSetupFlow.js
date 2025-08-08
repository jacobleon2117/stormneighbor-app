// File: frontend/src/screens/auth/profile/ProfileSetupFlow.js
import { useState } from "react";
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
    console.log("Location data collected:", locationData);
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
    console.log("Profile data collected:", profileData);
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
    console.log("Notifications data collected:", notificationData);

    const finalSetupData = {
      ...setupData.location,
      ...setupData.profile,
      ...notificationData,
    };

    console.log("Final setup data:", finalSetupData);

    try {
      const result = await updateProfile(finalSetupData);

      if (result.success) {
        console.log("Profile setup completed successfully");

        await completeProfileSetup();

        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        console.error("Profile setup failed:", result.error);

        Alert.alert(
          "Setup Complete",
          "Your profile setup is complete. You can update your information anytime in settings.",
          [
            {
              text: "Continue",
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

      Alert.alert(
        "Setup Complete",
        "Your profile setup is complete. You can update your information anytime in settings.",
        [
          {
            text: "Continue",
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
