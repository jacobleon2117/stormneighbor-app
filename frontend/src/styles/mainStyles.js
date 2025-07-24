// File: frontend/src/styles/mainStyles.js
import { StyleSheet } from "react-native";

export const mainStyles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  headerButtonActive: {
    backgroundColor: "#EBF8FF",
  },

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
  },

  // Post Styles
  postCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  postTime: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 2,
  },
  postContent: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    fontFamily: "Inter",
  },

  // Button Styles
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Action Styles
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: "#EBF8FF",
  },
  actionText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
    marginLeft: 6,
  },
  actionTextActive: {
    color: "#3B82F6",
    fontWeight: "500",
  },

  // Badge Styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  badgeCritical: {
    backgroundColor: "#FEE2E2",
  },
  badgeCriticalText: {
    color: "#EF4444",
  },
  badgeWarning: {
    backgroundColor: "#FEF3C7",
  },
  badgeWarningText: {
    color: "#F59E0B",
  },
  badgeInfo: {
    backgroundColor: "#DBEAFE",
  },
  badgeInfoText: {
    color: "#3B82F6",
  },
  badgeSuccess: {
    backgroundColor: "#D1FAE5",
  },
  badgeSuccessText: {
    color: "#10B981",
  },

  // Form Styles
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "Inter",
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },
  inputFocused: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 8,
  },

  // Text Styles
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter",
  },
  bodyText: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "Inter",
    lineHeight: 24,
  },
  smallText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3B82F6",
    fontFamily: "Inter",
  },

  // Layout Utilities
  row: {
    flexDirection: "row",
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

  // Spacing Utilities
  marginBottom8: { marginBottom: 8 },
  marginBottom12: { marginBottom: 12 },
  marginBottom16: { marginBottom: 16 },
  marginBottom20: { marginBottom: 20 },
  marginBottom24: { marginBottom: 24 },
  marginTop8: { marginTop: 8 },
  marginTop12: { marginTop: 12 },
  marginTop16: { marginTop: 16 },
  paddingHorizontal16: { paddingHorizontal: 16 },
  paddingVertical12: { paddingVertical: 12 },
  paddingVertical16: { paddingVertical: 16 },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    lineHeight: 24,
  },

  // Tab Navigation Styles
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
  },
  tabLabelActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});

// Color constants for main app
export const mainColors = {
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  secondary: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  critical: "#DC2626",
  background: "#F8FAFF",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: {
    primary: "#1F2937",
    secondary: "#374151",
    muted: "#6B7280",
    inverse: "#FFFFFF",
  },
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

export default mainStyles;
