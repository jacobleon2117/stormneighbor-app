// File: frontend/src/components/TopNav.js
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Search, MessageCircle, MoreHorizontal } from "lucide-react-native";

const TopNav = ({
  title,
  showSearch = true,
  showMessages = true,
  showMore = true,
  onSearchPress,
  onMessagesPress,
  onMorePress,
  rightComponent,
}) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

          {rightComponent || (
            <View style={styles.headerRight}>
              {showSearch && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onSearchPress}
                >
                  <Search size={24} color="#1F2937" />
                </TouchableOpacity>
              )}

              {showMessages && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onMessagesPress}
                >
                  <MessageCircle size={24} color="#1F2937" />
                </TouchableOpacity>
              )}

              {showMore && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onMorePress}
                >
                  <MoreHorizontal size={24} color="#1F2937" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
    justifyContent: "flex-end",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default TopNav;
