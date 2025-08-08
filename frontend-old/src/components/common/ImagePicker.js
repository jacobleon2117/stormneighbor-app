// File: frontend/src/components/common/ImagePicker.js
import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ExpoImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, User } from "lucide-react-native";
import { colors, spacing, borderRadius } from "@styles/designSystem";
import apiService from "@services/api";

const ImagePicker = ({
  currentImageUrl,
  onImageUploaded,
  size = 100,
  showUploadButton = true,
  placeholder = "Upload Image",
}) => {
  const [uploading, setUploading] = useState(false);

  const showImagePicker = () => {
    console.log("ImagePicker: showImagePicker called");

    Alert.alert("Select Image", "Choose how you want to select an image", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("User cancelled"),
      },
      { text: "Camera", onPress: openCamera },
      { text: "Photo Library", onPress: openImageLibrary },
    ]);
  };

  const openCamera = async () => {
    console.log("Opening camera...");

    try {
      const permissionResult =
        await ExpoImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Camera result:", result);
      handleImageResult(result);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", `Camera error: ${error.message}`);
    }
  };

  const openImageLibrary = async () => {
    console.log("Opening photo library...");

    try {
      const permissionResult =
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

      console.log("Permission result:", permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select photos"
        );
        return;
      }

      console.log("Launching image library...");
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Photo library result:", result);
      handleImageResult(result);
    } catch (error) {
      console.error("Photo library error:", error);
      Alert.alert("Error", `Photo library error: ${error.message}`);
    }
  };

  const handleImageResult = async (result) => {
    console.log("Processing image result:", result);

    if (result.canceled) {
      console.log("User cancelled image selection");
      return;
    }

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      console.log("Selected image asset:", {
        uri: asset.uri,
        type: asset.type,
        width: asset.width,
        height: asset.height,
      });

      await uploadImage(asset.uri);
    } else {
      console.error("No assets in result");
      Alert.alert("Error", "No image was selected");
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      setUploading(true);
      console.log("Starting upload for:", imageUri);

      const result = await apiService.uploadProfileImage(imageUri);
      console.log("Upload result:", result);

      if (result.success) {
        console.log("Upload successful:", result.data);
        Alert.alert("Success", "Image uploaded successfully!");

        if (onImageUploaded) {
          onImageUploaded(result.data.imageUrl, result.data);
        }
      } else {
        console.error("Upload failed:", result.error);
        Alert.alert("Upload Failed", result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", `Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, { width: size, height: size }]}
        onPress={() => {
          console.log("Image container tapped");
          showImagePicker();
        }}
        disabled={uploading}
      >
        {uploading ? (
          <View
            style={[styles.uploadingOverlay, { width: size, height: size }]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            style={[styles.image, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <User size={size * 0.4} color={colors.text.muted} />
          </View>
        )}

        {!uploading && (
          <View style={styles.cameraIcon}>
            <Camera size={20} color={colors.text.inverse} />
          </View>
        )}
      </TouchableOpacity>

      {showUploadButton && !uploading && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => {
            console.log("Upload button tapped");
            showImagePicker();
          }}
        >
          <ImageIcon size={16} color={colors.primary} />
          <Text style={styles.uploadButtonText}>{placeholder}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  container: {
    alignItems: "center",
  },

  imageContainer: {
    borderRadius: 100,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
    position: "relative",
  },

  image: {
    borderRadius: 100,
  },

  placeholder: {
    borderRadius: 100,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },

  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },

  uploadingText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: "500",
  },

  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },

  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },

  uploadButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: "500",
  },
};

export default ImagePicker;
