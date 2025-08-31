import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Send, ArrowLeft } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Message } from "../../types";

export default function ConversationScreen() {
  const { id, userName, userImage } = useLocalSearchParams<{
    id: string;
    userName: string;
    userImage: string;
  }>();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const conversationId = parseInt(id || "0", 10);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiService.getMessages(conversationId);

      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const response = await apiService.sendMessage(conversationId, {
        content: messageContent,
      });

      if (response.success && response.data) {
        const newMsg: Message = {
          id: response.data.message.id,
          conversationId: response.data.message.conversationId || conversationId,
          senderId: response.data.message.senderId,
          recipientId: response.data.message.recipientId,
          content: response.data.message.content,
          messageType: response.data.message.messageType || "text",
          images: response.data.message.images || [],
          isRead: response.data.message.isRead,
          createdAt: response.data.message.createdAt,
          isEdited: false,
          sender: {
            id: user?.id || 0,
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            profileImageUrl: user?.profileImageUrl,
          },
        };

        setMessages((prev) => [...prev, newMsg]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const messageDate = new Date(dateString);
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateString: string): string => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );

    if (messageDay.getTime() === today.getTime()) {
      return "Today";
    } else if (messageDay.getTime() === today.getTime() - 86400000) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message): boolean => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [conversationId, fetchMessages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFromCurrentUser = item.senderId === user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isFromCurrentUser ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          {!isFromCurrentUser && (
            <View style={styles.avatarContainer}>
              {userImage ? (
                <Image source={{ uri: userImage }} style={styles.messageAvatar} />
              ) : (
                <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {userName?.split(" ")[0]?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isFromCurrentUser ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isFromCurrentUser ? styles.sentText : styles.receivedText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isFromCurrentUser ? styles.sentTime : styles.receivedTime,
              ]}
            >
              {formatTime(item.createdAt)}
              {isFromCurrentUser && (
                <Text style={styles.messageStatus}>{item.isRead ? " Read" : " Sent"}</Text>
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{userName || "Conversation"}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {userName?.split(" ")[0]?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{userName || "Conversation"}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? 0 : 34 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={Colors.text.disabled}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <Send size={20} color={Colors.text.inverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: Colors.text.secondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 2,
    alignItems: "flex-end",
  },
  sentMessage: {
    justifyContent: "flex-end",
  },
  receivedMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary[700],
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  sentBubble: {
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  sentText: {
    color: Colors.text.inverse,
  },
  receivedText: {
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  sentTime: {
    color: Colors.primary[100],
    textAlign: "right",
  },
  receivedTime: {
    color: Colors.text.disabled,
  },
  messageStatus: {
    fontSize: 11,
  },
  inputContainer: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: Colors.primary[500],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
});
