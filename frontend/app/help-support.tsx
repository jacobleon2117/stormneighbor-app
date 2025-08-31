import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Mail, MessageSquare, BookOpen, Phone, ExternalLink } from "lucide-react-native";
import { Header } from "../components/UI/Header";
import { Button } from "../components/UI/Button";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "general" | "technical" | "account" | "emergency";
}

const FAQ_DATA: FAQ[] = [
  {
    id: "1",
    question: "How do I report an emergency?",
    answer:
      "To report an emergency, create a new post and select 'Safety Alert' as the post type. Make sure to include your location and set the priority to 'Urgent'. For life-threatening emergencies, always call 911 first.",
    category: "emergency",
  },
  {
    id: "2",
    question: "How do I update my location settings?",
    answer:
      "Go to your Profile > Location Settings to update your address, radius preferences, and location sharing settings. You can control who sees your location and when it's shared.",
    category: "account",
  },
  {
    id: "3",
    question: "Why am I not receiving notifications?",
    answer:
      "Check your device's notification settings and ensure StormNeighbor has permission. Also verify your in-app notification preferences in Profile > Notifications.",
    category: "technical",
  },
  {
    id: "4",
    question: "How do I connect with neighbors?",
    answer:
      "Browse the main feed to see posts from neighbors in your area. You can like, comment, and share posts to engage with your community. Use the search feature to find specific topics or types of posts.",
    category: "general",
  },
  {
    id: "5",
    question: "What should I do if I see inappropriate content?",
    answer:
      "You can report any post or comment by tapping the three dots menu and selecting 'Report'. Our moderation team will review all reports within 24 hours.",
    category: "general",
  },
  {
    id: "6",
    question: "How do I change my password?",
    answer:
      "Go to Profile > Privacy & Security > Change Password. You'll need to enter your current password and choose a new secure password.",
    category: "account",
  },
];

export default function HelpSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    category: "general",
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { key: "all", label: "All" },
    { key: "general", label: "General" },
    { key: "technical", label: "Technical" },
    { key: "account", label: "Account" },
    { key: "emergency", label: "Emergency" },
  ];

  const filteredFAQs = FAQ_DATA.filter(
    (faq) => selectedCategory === "all" || faq.category === selectedCategory
  );

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@stormneighbor.app?subject=Support Request");
  };

  const handleEmergencyHelp = () => {
    Alert.alert(
      "Emergency Help",
      "For life-threatening emergencies, call 911 immediately.\n\nFor urgent community safety concerns, create a Safety Alert post with priority set to 'Urgent'.",
      [
        { text: "Call 911", onPress: () => Linking.openURL("tel:911") },
        {
          text: "Create Safety Alert",
          onPress: () => router.push("/(tabs)/create"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleViewGuides = () => {
    Linking.openURL("https://docs.stormneighbor.app/user-guides");
  };

  const handleSubmitContact = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert("Error", "Please fill in all fields before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.getApi().post("/support/contact", {
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        category: contactForm.category,
      });

      if (response.data.success) {
        Alert.alert(
          "Message Sent",
          "Thank you for contacting us! We'll get back to you within 24 hours.",
          [{ text: "OK", onPress: () => setShowContactForm(false) }]
        );
        setContactForm({ subject: "", message: "", category: "general" });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      Alert.alert(
        "Error",
        "Failed to send your message. Please try again or email us directly at support@stormneighbor.app"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuickAction = (
    icon: any,
    title: string,
    description: string,
    onPress: () => void,
    color = Colors.primary[600]
  ) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        {React.createElement(icon, { size: 24, color })}
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
    </TouchableOpacity>
  );

  const renderFAQ = (faq: FAQ) => {
    const isExpanded = expandedFAQ === faq.id;

    return (
      <TouchableOpacity
        key={faq.id}
        style={styles.faqItem}
        onPress={() => setExpandedFAQ(isExpanded ? null : faq.id)}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={Colors.text.secondary}
          />
        </View>
        {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
      </TouchableOpacity>
    );
  };

  const renderContactForm = () => (
    <View style={styles.contactForm}>
      <Text style={styles.contactFormTitle}>Contact Support</Text>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Category</Text>
        <View style={styles.categoryButtons}>
          {categories.slice(1).map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                contactForm.category === category.key && styles.selectedCategory,
              ]}
              onPress={() => setContactForm((prev) => ({ ...prev, category: category.key }))}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  contactForm.category === category.key && styles.selectedCategoryText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Subject</Text>
        <TextInput
          style={styles.textInput}
          value={contactForm.subject}
          onChangeText={(text) => setContactForm((prev) => ({ ...prev, subject: text }))}
          placeholder="Brief description of your issue"
          placeholderTextColor={Colors.text.disabled}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Message</Text>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          value={contactForm.message}
          onChangeText={(text) => setContactForm((prev) => ({ ...prev, message: text }))}
          placeholder="Please provide as much detail as possible..."
          placeholderTextColor={Colors.text.disabled}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formActions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => setShowContactForm(false)}
          style={styles.cancelButton}
          disabled={submitting}
        />
        <Button
          title={submitting ? "Sending..." : "Send Message"}
          onPress={handleSubmitContact}
          style={styles.submitButton}
          disabled={submitting}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Help & Support" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showContactForm ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Help</Text>

              {renderQuickAction(
                Phone,
                "Emergency Help",
                "Call 911 or create safety alert",
                handleEmergencyHelp,
                Colors.error[600]
              )}

              {renderQuickAction(
                Mail,
                "Email Support",
                "Send us a direct message",
                handleEmailSupport
              )}

              {renderQuickAction(MessageSquare, "Contact Form", "Fill out our detailed form", () =>
                setShowContactForm(true)
              )}

              {renderQuickAction(
                BookOpen,
                "User Guides",
                "Step-by-step tutorials",
                handleViewGuides
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryFilter}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.key && styles.activeCategoryChip,
                    ]}
                    onPress={() => setSelectedCategory(category.key)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.key && styles.activeCategoryChipText,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.faqList}>{filteredFAQs.map(renderFAQ)}</View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>

              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Mail size={20} color={Colors.primary[600]} />
                  <Text style={styles.contactText}>support@stormneighbor.app</Text>
                </View>

                <View style={styles.contactItem}>
                  <ExternalLink size={20} color={Colors.primary[600]} />
                  <Text style={styles.contactText}>docs.stormneighbor.app</Text>
                </View>
              </View>

              <Text style={styles.responseTime}>Average response time: 24 hours</Text>
            </View>
          </>
        ) : (
          renderContactForm()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  quickAction: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickActionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[300],
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  activeCategoryChipText: {
    color: Colors.primary[700],
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  contactInfo: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  responseTime: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "center",
  },
  contactForm: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactFormTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCategory: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[300],
  },
  categoryButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: Colors.primary[700],
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral[50],
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
