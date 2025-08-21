import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

import "react-native-reanimated";

const Layout = () => {
  const { isSignedIn } = useAuth();

  return isSignedIn ? (
    <Redirect href="/(root)/(tabs)/home" />
  ) : (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
