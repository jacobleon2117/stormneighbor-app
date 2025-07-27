// File: frontend/src/screens/auth/ContactSupportScreen.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Mail, MessageCircle, ArrowRight } from "lucide-react-native";
import {
  globalStyles,
  colors,
  spacing,
  createButtonStyle,
} from "@styles/designSystem";
import ScreenLayout from "@components/layout/ScreenLayout";
import StandardHeader from "@components/layout/StandardHeader";

const ContactSupportScreen = ({ onBack, userEmail }) => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    email: userEmail || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const emailSubject = encodeURIComponent(
        `StormNeighbor Support: ${formData.subject}`
      );
      const emailBody = encodeURIComponent(
        `From: ${formData.email}\n\nMessage:\n${formData.message}\n\n---\nSent from StormNeighbor app`
      );

      const mailtoUrl = `mailto:support@stormneighbor.com?subject=${emailSubject}&body=${emailBody}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          "Email Opened",
          "We've opened your email app with your message. Please send it to reach our support team.",
          [{ text: "OK", onPress: onBack }]
        );
      } else {
        Alert.alert(
          "Email Not Available",
          "Please email us directly at support@stormneighbor.com with your message.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailDirect = () => {
    const mailtoUrl = "mailto:support@stormneighbor.com";
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        "Email Not Available",
        "Please email us directly at support@stormneighbor.com"
      );
    });
  };

  return (
    <ScreenLayout showHeader={false} backgroundColor={colors.background}>
      <StandardHeader
        showBack={!!onBack}
        onBack={onBack}
        title="Contact Support"
      />

      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        <View
          style={[
            globalStyles.center,
            { marginBottom: spacing.xl, marginTop: spacing.xl },
          ]}
        >
          <MessageCircle size={32} color={colors.primary} />
          <Text
            style={[
              globalStyles.bodySecondary,
              { textAlign: "center", marginTop: spacing.md },
            ]}
          >
            We're here to help! Send us a message and we'll get back to you as
            soon as possible
          </Text>
        </View>

        <View style={[globalStyles.card, { marginBottom: spacing.xl }]}>
          <Text
            style={[
              globalStyles.body,
              { fontWeight: "600", marginBottom: spacing.lg },
            ]}
          >
            Quick Contact Options:
          </Text>

          <TouchableOpacity
            style={styles.contactOption}
            onPress={handleEmailDirect}
          >
            <Mail size={20} color={colors.primary} />
            <View style={[globalStyles.flex1, { marginLeft: spacing.md }]}>
              <Text style={[globalStyles.body, { fontWeight: "600" }]}>
                Email Support
              </Text>
              <Text style={globalStyles.caption}>
                support@stormneighbor.com
              </Text>
            </View>
            <ArrowRight size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Your Email</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.email && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="your@email.com"
            placeholderTextColor={colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.email && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.email}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={globalStyles.label}>Subject</Text>
          <TextInput
            style={[
              globalStyles.input,
              errors.subject && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.subject}
            onChangeText={(value) => updateField("subject", value)}
            placeholder="What can we help you with?"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="sentences"
            editable={!loading}
          />
          {errors.subject && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.subject}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={globalStyles.label}>Message</Text>
          <TextInput
            style={[
              globalStyles.input,
              {
                height: 120,
                textAlignVertical: "top",
                paddingTop: spacing.md,
              },
              errors.message && { borderColor: colors.error, borderWidth: 2 },
            ]}
            value={formData.message}
            onChangeText={(value) => updateField("message", value)}
            placeholder="Please describe your issue or question in detail..."
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={6}
            autoCapitalize="sentences"
            editable={!loading}
          />
          {errors.message && (
            <Text
              style={[
                globalStyles.caption,
                { color: colors.error, marginTop: spacing.xs },
              ]}
            >
              {errors.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            createButtonStyle("primary", "large"),
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={globalStyles.buttonContent}>
              <MessageCircle size={20} color={colors.text.inverse} />
              <Text style={globalStyles.buttonPrimaryText}>Send Message</Text>
            </View>
          )}
        </TouchableOpacity>

        <View
          style={[
            globalStyles.card,
            { backgroundColor: colors.background, marginTop: spacing.xl },
          ]}
        >
          <Text style={globalStyles.caption}>
            <Text style={{ fontWeight: "600" }}>Response Time:</Text> We
            typically respond within 24 hours during business days.
            {"\n\n"}
            <Text style={{ fontWeight: "600" }}>Emergency Issues:</Text> For
            urgent weather-related issues, please contact local emergency
            services.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = {
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export default ContactSupportScreen;
