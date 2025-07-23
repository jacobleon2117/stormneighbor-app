// File path: frontend/src/styles/authStyles.js

import { StyleSheet } from "react-native";

// Standardized styles for all auth screens
export const authStyles = StyleSheet.create({
  // Text Styles
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
    color: "#1F2937",
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  smallText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    fontFamily: "Inter",
  },

  // Input Styles
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  // Button Styles
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    fontFamily: "Inter",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Container Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
  },

  // Spacing
  marginBottom8: { marginBottom: 8 },
  marginBottom12: { marginBottom: 12 },
  marginBottom16: { marginBottom: 16 },
  marginBottom20: { marginBottom: 20 },
  marginBottom24: { marginBottom: 24 },
  marginBottom32: { marginBottom: 32 },
  marginTop8: { marginTop: 8 },
  marginTop12: { marginTop: 12 },
  marginTop16: { marginTop: 16 },
  marginTop20: { marginTop: 20 },
  marginTop24: { marginTop: 24 },
  marginTop32: { marginTop: 32 },

  // Flex helpers
  row: { flexDirection: "row" },
  alignCenter: { alignItems: "center" },
  justifyCenter: { justifyContent: "center" },
  justifyBetween: { justifyContent: "space-between" },
  flex1: { flex: 1 },

  // Common UI patterns
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  socialText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    fontFamily: "Inter",
  },
});

// Color constants
export const colors = {
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  secondary: "#6B7280",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  background: "#F8FAFF",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    inverse: "#FFFFFF",
  },
};

// Spacing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Typography constants
export const typography = {
  fontFamily: "Inter",
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
  },
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};
