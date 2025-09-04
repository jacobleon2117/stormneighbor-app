import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";

export default function NewConversationScreen() {
  const { recipientId, recipientName } = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
  }>();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setSending(true);

    try {
      const response = await apiService.createConversation(
        parseInt(recipientId || "0"),
        message.trim()
      );

      if (response.success && response.data) {
        router.replace({
          pathname: "/conversation/[id]" as any,
          params: {
            id: response.data.conversationId,
            userName: recipientName,
            userImage: response.data.otherUser?.profileImageUrl || "",
          },
        });
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.recipientInfo}>
          <Text style={styles.recipientLabel}>To:</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Your message:</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder={`Say hello to ${recipientName}...`}
            placeholderTextColor={Colors.text.disabled}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.characterCount}>{message.length}/1000</Text>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <Send size={20} color={Colors.text.inverse} />
          )}
          <Text style={styles.sendButtonText}>{sending ? "Sending" : "Send Message"}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recipientLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginRight: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    textAlignVertical: "top",
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary[600],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  sendButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
