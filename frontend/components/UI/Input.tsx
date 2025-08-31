import React from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from "react-native";
import { Colors } from "../../constants/Colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  required = false,
  containerStyle,
  ...textInputProps
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          textInputProps.editable === false && styles.inputDisabled,
        ]}
        placeholderTextColor={Colors.text.disabled}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 6,
  },
  required: {
    color: Colors.error[600],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
  inputError: {
    borderColor: Colors.error[600],
  },
  inputDisabled: {
    backgroundColor: Colors.neutral[100],
    color: Colors.text.disabled,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error[600],
    marginTop: 4,
  },
});
