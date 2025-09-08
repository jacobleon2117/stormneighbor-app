import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Text,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { X, Download, Share2 } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
  onDownload,
  onShare,
}) => {
  const [showControls, setShowControls] = useState(true);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newScale = clamp(savedScale.value * event.scale, 0.5, 5);
      scale.value = newScale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }

      const maxTranslateX = ((scale.value - 1) * screenWidth) / 2;
      const maxTranslateY = ((scale.value - 1) * screenHeight) / 2;

      translateX.value = withSpring(clamp(translateX.value, -maxTranslateX, maxTranslateX));
      translateY.value = withSpring(clamp(translateY.value, -maxTranslateY, maxTranslateY));
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslateX = ((scale.value - 1) * screenWidth) / 2;
        const maxTranslateY = ((scale.value - 1) * screenHeight) / 2;

        translateX.value = clamp(
          savedTranslateX.value + event.translationX,
          -maxTranslateX,
          maxTranslateX
        );
        translateY.value = clamp(
          savedTranslateY.value + event.translationY,
          -maxTranslateY,
          maxTranslateY
        );
      }
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      if (scale.value === 1) {
        scale.value = withSpring(2);
        translateX.value = withSpring(event.x - screenWidth / 2);
        translateY.value = withSpring(event.y - screenHeight / 2);
      } else {
        runOnJS(resetTransform)();
      }
    });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const handleClose = () => {
    resetTransform();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[styles.header, { opacity: showControls ? 1 : 0 }]}
            pointerEvents={showControls ? "auto" : "none"}
          >
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <X size={24} color={Colors.text.inverse} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {onShare && (
                <TouchableOpacity onPress={onShare} style={styles.headerButton}>
                  <Share2 size={20} color={Colors.text.inverse} />
                </TouchableOpacity>
              )}
              {onDownload && (
                <TouchableOpacity onPress={onDownload} style={styles.headerButton}>
                  <Download size={20} color={Colors.text.inverse} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <View style={styles.imageContainer}>
            <GestureDetector gesture={combinedGesture}>
              <Animated.View style={styles.imageWrapper}>
                <GestureDetector gesture={tapGesture}>
                  <Animated.View style={styles.imageWrapper}>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={toggleControls}
                      style={styles.imageTouchable}
                    >
                      <Animated.Image
                        source={{ uri: imageUrl }}
                        style={[styles.image, animatedImageStyle]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </GestureDetector>
              </Animated.View>
            </GestureDetector>
          </View>

          <Animated.View
            style={[styles.footer, { opacity: showControls ? 1 : 0 }]}
            pointerEvents={showControls ? "auto" : "none"}
          >
            <View style={styles.instructions}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon} />
                <View style={styles.instructionTexts}>
                  <Text style={styles.instructionTitle}>Pinch to zoom</Text>
                  <Text style={styles.instructionSubtitle}>Use two fingers to zoom in/out</Text>
                </View>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon} />
                <View style={styles.instructionTexts}>
                  <Text style={styles.instructionTitle}>Drag to pan</Text>
                  <Text style={styles.instructionSubtitle}>Move around when zoomed in</Text>
                </View>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon} />
                <View style={styles.instructionTexts}>
                  <Text style={styles.instructionTitle}>Double tap</Text>
                  <Text style={styles.instructionSubtitle}>Zoom in/out quickly</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  imageTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 10,
  },
  instructions: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  instructionTexts: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.inverse,
  },
  instructionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
});
