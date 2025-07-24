// File path: frontend/src/screens/auth/WelcomeScreen.js
import { View, Text, TouchableOpacity, Image } from "react-native";
import AuthLayout from "@components/AuthLayout";
import { authStyles, colors } from "@styles/authStyles";

const WelcomeScreen = ({ onGetStarted, onSignIn }) => {
  return (
    <AuthLayout scrollable={false}>
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Image
          source={require("../../../assets/images/illustration.png")}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
          }}
          resizeMode="contain"
        />
      </View>

      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text style={[authStyles.title, { fontSize: 36, fontWeight: "700" }]}>
          Storm<Text style={{ color: colors.primary }}>Neighbor</Text>
        </Text>
        <Text style={[authStyles.subtitle, { marginTop: 8 }]}>
          Connect with your community during weather emergencies
        </Text>
      </View>

      <View style={{ gap: 16, marginBottom: 20 }}>
        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={onGetStarted}
        >
          <Text style={authStyles.primaryButtonText}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={authStyles.secondaryButton} onPress={onSignIn}>
          <Text style={authStyles.secondaryButtonText}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

export default WelcomeScreen;
