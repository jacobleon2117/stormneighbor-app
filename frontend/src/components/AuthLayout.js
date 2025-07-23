import React from "react";
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";

const AuthLayout = ({
  children,
  showBackButton = false,
  onBack,
  scrollable = true,
  keyboardAvoidingEnabled = true,
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContainer,
        keyboardShouldPersistTaps: keyboardAvoidingEnabled
          ? "handled"
          : "never",
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.staticContainer };

  return (
    <SafeAreaView style={styles.container}>
      <ContentWrapper {...contentProps}>
        <View style={styles.wrapper}>
          {/* Back Button */}
          {showBackButton && onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </ContentWrapper>
    </SafeAreaView>
  );
};

// Standard header component for consistency
export const AuthHeader = ({ title, subtitle, icon }) => (
  <View style={styles.header}>
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <View style={styles.headerText}>
      <View style={styles.title}>{title}</View>
      {subtitle && <View style={styles.subtitle}>{subtitle}</View>}
    </View>
  </View>
);

// Standard form container
export const AuthForm = ({ children }) => (
  <View style={styles.form}>{children}</View>
);

// Standard input container
export const AuthInput = ({ label, children, error }) => (
  <View style={styles.inputContainer}>
    {label && <View style={styles.label}>{label}</View>}
    {children}
    {error && <View style={styles.errorText}>{error}</View>}
  </View>
);

// Standard button container
export const AuthButtons = ({ children }) => (
  <View style={styles.buttonContainer}>{children}</View>
);

// Standard footer
export const AuthFooter = ({ children }) => (
  <View style={styles.footer}>{children}</View>
);

const styles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  staticContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  wrapper: {
    justifyContent: "center",
    minHeight: "100%",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: -20,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  content: {
    justifyContent: "center",
    minHeight: "80%",
  },

  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerText: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
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

  // Form Styles
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#EF4444",
    marginTop: 4,
    fontFamily: "Inter",
  },

  // Button Styles
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },

  // Footer Styles
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});

export default AuthLayout;
