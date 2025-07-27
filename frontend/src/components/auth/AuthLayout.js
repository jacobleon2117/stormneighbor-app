// File: frontend/src/components/AuthLayout.js
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
          {showBackButton && onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          )}

          <View style={styles.content}>{children}</View>
        </View>
      </ContentWrapper>
    </SafeAreaView>
  );
};

export const AuthHeader = ({ title, subtitle, icon }) => (
  <View style={styles.header}>
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <View style={styles.headerText}>
      <View style={styles.title}>{title}</View>
      {subtitle && <View style={styles.subtitle}>{subtitle}</View>}
    </View>
  </View>
);

export const AuthForm = ({ children }) => (
  <View style={styles.form}>{children}</View>
);

export const AuthInput = ({ label, children, error }) => (
  <View style={styles.inputContainer}>
    {label && <View style={styles.label}>{label}</View>}
    {children}
    {error && <View style={styles.errorText}>{error}</View>}
  </View>
);

export const AuthButtons = ({ children }) => (
  <View style={styles.buttonContainer}>{children}</View>
);

export const AuthFooter = ({ children }) => (
  <View style={styles.footer}>{children}</View>
);

const styles = StyleSheet.create({
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
  header: {
    alignItems: "center",
    marginBottom: 24,
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
  form: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});

export default AuthLayout;
