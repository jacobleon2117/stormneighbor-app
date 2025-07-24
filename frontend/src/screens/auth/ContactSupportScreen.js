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
import { Mail, MessageCircle, Phone, ArrowRight } from "lucide-react-native";

import AuthLayout, {
  AuthHeader,
  AuthButtons,
  AuthFooter,
} from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

const ContactSupportScreen = ({ onBack, userEmail }) => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    email: userEmail || "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendMessage = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      Alert.alert("Error", "Please fill in both subject and message");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("Error", "Please provide your email address");
      return;
    }

    setLoading(true);
    try {
      // I'll compose an email for now, but i'm looking to add an support system
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
    <AuthLayout showBackButton={!!onBack} onBack={onBack}>
      {/* Header */}
      <AuthHeader
        icon={<MessageCircle size={32} color={colors.primary} />}
        title={<Text style={authStyles.title}>Contact Support</Text>}
        subtitle={
          <Text style={authStyles.subtitle}>
            We're here to help! Send us a message and we'll get back to you as
            soon as possible
          </Text>
        }
      />

      {/* Contact Options */}
      <View style={[authStyles.card, { marginBottom: 24 }]}>
        <Text style={[authStyles.label, { marginBottom: 16 }]}>
          Quick Contact Options:
        </Text>

        <TouchableOpacity
          style={contactStyles.contactOption}
          onPress={handleEmailDirect}
        >
          <Mail size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[authStyles.bodyText, { fontWeight: "600" }]}>
              Email Support
            </Text>
            <Text style={authStyles.smallText}>support@stormneighbor.com</Text>
          </View>
          <ArrowRight size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Contact Form */}
      <Text style={authStyles.label}>Your Email</Text>
      <TextInput
        style={authStyles.input}
        value={formData.email}
        onChangeText={(value) => updateField("email", value)}
        placeholder="your@email.com"
        placeholderTextColor={colors.text.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={authStyles.label}>Subject</Text>
      <TextInput
        style={authStyles.input}
        value={formData.subject}
        onChangeText={(value) => updateField("subject", value)}
        placeholder="What can we help you with?"
        placeholderTextColor={colors.text.muted}
        autoCapitalize="sentences"
      />

      <Text style={authStyles.label}>Message</Text>
      <TextInput
        style={[authStyles.input, authStyles.textArea]}
        value={formData.message}
        onChangeText={(value) => updateField("message", value)}
        placeholder="Please describe your issue or question in detail..."
        placeholderTextColor={colors.text.muted}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        autoCapitalize="sentences"
      />

      {/* Send Message Button */}
      <AuthButtons>
        <TouchableOpacity
          style={[
            authStyles.primaryButton,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <View style={authStyles.buttonContent}>
              <MessageCircle size={20} color={colors.text.inverse} />
              <Text style={authStyles.primaryButtonText}>Send Message</Text>
            </View>
          )}
        </TouchableOpacity>
      </AuthButtons>

      {/* Help Text */}
      <View style={[authStyles.card, { backgroundColor: colors.background }]}>
        <Text style={authStyles.smallText}>
          <Text style={{ fontWeight: "600" }}>Response Time:</Text> We typically
          respond within 24 hours during business days.
          {"\n\n"}
          <Text style={{ fontWeight: "600" }}>Emergency Issues:</Text> For
          urgent weather-related issues, please contact local emergency
          services.
        </Text>
      </View>
    </AuthLayout>
  );
};

// Custom styles for contact options
const contactStyles = {
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export default ContactSupportScreen;
