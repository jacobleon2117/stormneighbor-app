import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By downloading, installing, or using the StormNeighbor application ("App"), you agree to
          be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not
          use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          StormNeighbor is a community-based weather alert application that provides real-time,
          local severe weather alerts and updates from your community members.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          To use certain features of the App, you must create an account. You are responsible for
          maintaining the confidentiality of your account credentials and for all activities that
          occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>4. User Content</Text>
        <Text style={styles.paragraph}>
          You may post weather-related content, including reports, photos, and comments. You retain
          ownership of your content but grant us a license to use, display, and distribute it within
          the App.
        </Text>

        <Text style={styles.sectionTitle}>5. Community Guidelines</Text>
        <Text style={styles.paragraph}>
          Users must provide accurate weather information and respectful community interaction.
          False weather reports or inappropriate content may result in account suspension.
        </Text>

        <Text style={styles.sectionTitle}>6. Privacy</Text>
        <Text style={styles.paragraph}>
          Your privacy is important to us. Please review our Privacy Policy to understand how we
          collect, use, and protect your information.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          StormNeighbor is not responsible for the accuracy of user-generated weather reports.
          Always consult official weather services for critical weather decisions.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. Continued use of the App after
          changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: "italic",
    marginTop: 32,
    textAlign: "center",
  },
});
