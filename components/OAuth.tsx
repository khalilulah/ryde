import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";
import { useAuth, useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import CustomButton from "./CustomButton";

const OAuth = () => {
  const { isSignedIn } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (isSignedIn) {
      router.replace("/(root)/(tabs)/home");
      return;
    }

    setIsLoading(true);

    try {
      const result = await googleOAuth(startOAuthFlow);

      if (result.code === "session_exists") {
        Alert.alert("Success", "Session exists. Redirecting to home screen.");
        router.replace("/(root)/(tabs)/home");
        return;
      }

      if (result.success) {
        Alert.alert("Success", result.message);
        router.replace("/(root)/(tabs)/home");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("OAuth error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, startOAuthFlow]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title={isLoading ? "Signing in..." : "Log In with Google"}
        className="mt-5 w-full shadow-none"
        disabled={isLoading}
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
