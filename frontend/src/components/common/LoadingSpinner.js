// File: frontend/src/components/common/LoadingSpinner.js
import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@styles/designSystem";

const LoadingSpinner = ({
  size = 40,
  color = colors.primary,
  strokeWidth = 3,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderTopColor: color,
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            borderRadius: size / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
};

const styles = {
  container: {
    justifyContent: "center",
    alignItems: "center",
  },

  spinner: {},
};

export default LoadingSpinner;
