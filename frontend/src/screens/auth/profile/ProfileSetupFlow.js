import { useState } from "react";
import { Alert } from "react-native";
import LocationSetupScreen from "./LocationSetupScreen";
import ProfileSetupScreenIndividual from "./ProfileSetupScreenIndividual";
import NotificationsSetupScreen from "./NotificationsSetupScreen";
import apiService from "../../../services/api";

const ProfileSetupFlow = ({ onSetupComplete, onBack }) => {
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
      const result = await apiService.updateProfile(finalSetupData);

      if (result.success) {
        Alert.alert("Success!", "Your profile has been set up successfully!", [
          { text: "Continue", onPress: onSetupComplete },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
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
