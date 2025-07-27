// File: frontend/src/styles/designSystem.js
import { StyleSheet } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
};

export const colors = {
  // Primary colors
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  primaryLight: "#DBEAFE",

  // Status colors
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  critical: "#DC2626",
  criticalLight: "#FEE2E2",

  // Background colors
  background: "#F8FAFF",
  surface: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.3)",

  // Border colors
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  borderFocus: "#3B82F6",

  // Text colors
  text: {
    primary: "#1F2937",
    secondary: "#374151",
    muted: "#6B7280",
    disabled: "#9CA3AF",
    inverse: "#FFFFFF",
    link: "#3B82F6",
  },

  // Alert specific colors
  alert: {
    critical: {
      bg: "#FEE2E2",
      text: "#EF4444",
      border: "#FECACA",
    },
    warning: {
      bg: "#FEF3C7",
      text: "#F59E0B",
      border: "#FDE68A",
    },
    info: {
      bg: "#DBEAFE",
      text: "#3B82F6",
      border: "#BFDBFE",
    },
    success: {
      bg: "#D1FAE5",
      text: "#10B981",
      border: "#A7F3D0",
    },
  },
};

export const typography = {
  fontFamily: "Inter",

  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32,
    xxxxxl: 36,
  },

  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Global Styles
export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  content: {
    flex: 1,
  },

  contentPadding: {
    paddingHorizontal: spacing.lg,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxxxl,
  },

  // Layout helpers
  row: {
    flexDirection: "row",
  },

  column: {
    flexDirection: "column",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  alignCenter: {
    alignItems: "center",
  },

  justifyCenter: {
    justifyContent: "center",
  },

  justifyBetween: {
    justifyContent: "space-between",
  },

  flex1: {
    flex: 1,
  },

  // Typography styles
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
  },

  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
  },

  heading: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  },

  body: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.normal,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },

  bodySecondary: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.normal,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },

  caption: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    color: colors.text.muted,
    fontFamily: typography.fontFamily,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },

  link: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.link,
    fontFamily: typography.fontFamily,
  },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  // Button styles
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.sm,
  },

  buttonPrimaryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily,
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  buttonSecondaryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  // Input styles
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
  },

  inputFocused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  },

  inputError: {
    borderColor: colors.error,
  },

  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.sm,
  },

  // Badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },

  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },

  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontFamily: typography.fontFamily,
    textAlign: "center",
    marginTop: spacing.lg,
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxxxl,
  },

  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontFamily: typography.fontFamily,
    textAlign: "center",
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },

  // Spacing utilities
  mb8: { marginBottom: spacing.sm },
  mb12: { marginBottom: spacing.md },
  mb16: { marginBottom: spacing.lg },
  mb20: { marginBottom: spacing.xl },
  mb24: { marginBottom: spacing.xxl },
  mb32: { marginBottom: spacing.xxxl },

  mt8: { marginTop: spacing.sm },
  mt12: { marginTop: spacing.md },
  mt16: { marginTop: spacing.lg },
  mt20: { marginTop: spacing.xl },
  mt24: { marginTop: spacing.xxl },
  mt32: { marginTop: spacing.xxxl },

  ph16: { paddingHorizontal: spacing.lg },
  pv12: { paddingVertical: spacing.md },
  pv16: { paddingVertical: spacing.lg },
});

// Helper functions
export const createButtonStyle = (variant = "primary", size = "medium") => {
  const baseStyle = {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: borderRadius.lg,
  };

  const sizeStyles = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    medium: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: "transparent",
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

export const createTextStyle = (variant = "body", weight = "normal") => {
  const baseStyle = {
    fontFamily: typography.fontFamily,
  };

  const variantStyles = {
    title: {
      fontSize: typography.sizes.xxxl,
      color: colors.text.primary,
      lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
    },
    heading: {
      fontSize: typography.sizes.xl,
      color: colors.text.primary,
      lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    },
    body: {
      fontSize: typography.sizes.md,
      color: colors.text.primary,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    },
    caption: {
      fontSize: typography.sizes.sm,
      color: colors.text.muted,
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    },
  };

  return {
    ...baseStyle,
    ...variantStyles[variant],
    fontWeight: typography.weights[weight],
  };
};
