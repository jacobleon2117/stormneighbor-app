import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "../../constants/Colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" ? Colors.text.inverse : Colors.primary[500]
          }
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    flexDirection: "row",
  },

  primary: {
    backgroundColor: Colors.primary[600],
  },
  secondary: {
    backgroundColor: Colors.neutral[100],
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  ghost: {
    backgroundColor: "transparent",
  },

  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },

  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: Colors.text.inverse,
  },
  secondaryText: {
    color: Colors.text.primary,
  },
  outlineText: {
    color: Colors.primary[600],
  },
  ghostText: {
    color: Colors.primary[600],
  },

  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  disabled: {
    backgroundColor: Colors.neutral[200],
    borderColor: Colors.neutral[200],
  },
  disabledText: {
    color: Colors.text.disabled,
  },
});
