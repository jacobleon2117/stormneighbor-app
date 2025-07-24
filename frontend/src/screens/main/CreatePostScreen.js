// File: frontend/src/screens/main/CreatePostScreen.js
import { View, StyleSheet } from "react-native";
import TopNav from "@components/layout/TopNav";

const CreatePostScreen = ({ user, onCreatePost }) => {
  return (
    <View style={styles.container}>
      <TopNav
        title="Create Post"
        showSearch={false}
        showMessages={false}
        showMore={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
});

export default CreatePostScreen;
