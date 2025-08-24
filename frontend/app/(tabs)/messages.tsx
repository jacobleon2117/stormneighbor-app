import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { Header } from "../../components/UI/Header";
import { Colors } from "../../constants/Colors";

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Messages"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <MessageCircle size={80} color={Colors.text.disabled} />
          <Text style={styles.emptyTitle}>dev</Text>
          <Text style={styles.emptyDescription}>
            dev
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    maxWidth: 300,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});