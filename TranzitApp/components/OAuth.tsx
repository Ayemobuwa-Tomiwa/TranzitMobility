import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { Alert } from "react-native";

import CustomButton from "@/components/CustomButton";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      Alert.alert("Google sign-in failed");
    }
  };

  return (
    <CustomButton
      title="Continue with Google"
      onPress={handleGoogleSignIn}
      className="mt-4"
    />
  );
};

export default OAuth;
