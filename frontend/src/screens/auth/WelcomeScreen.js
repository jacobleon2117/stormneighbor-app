import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";

const { height } = Dimensions.get("window");

const WelcomeScreen = ({ onGetStarted, onSignIn }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spaceBetweenContainer}>
          {/* Illustration Image */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../../assets/images/illustration.png")}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          {/* Title & Buttons */}
          <View style={styles.bottomContainer}>
            <Text style={styles.logoText}>
              Storm<Text style={styles.logoHighlight}>Neighbor</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onGetStarted}
              >
                <Text style={styles.primaryButtonText}>Let's get started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onSignIn}
              >
                <Text style={styles.secondaryButtonText}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  spaceBetweenContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: height * 0.15,
    width: "100%",
  },
  illustrationContainer: {
    // Nothing needed here at the moment
  },
  illustrationImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  bottomContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  logoText: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Inter",
    marginBottom: 12,
    textAlign: "center",
  },
  logoHighlight: {
    color: "#3B82F6",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
    maxWidth: 350,
    marginTop: 0,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    fontFamily: "Inter",
  },
});

export default WelcomeScreen;
