import { Stack } from "expo-router";
import { PaystackProvider } from "react-native-paystack-webview";
import "react-native-reanimated";

const Layout = () => {
  return (
    <PaystackProvider
      publicKey="pk_test_164131f9cc7a0809b70beda8a44da23a6453b5e5"
      currency="NGN"
      debug
      defaultChannels={["card", "bank_transfer", "bank", "ussd", "eft"]}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="find-ride" options={{ headerShown: false }} />
        <Stack.Screen name="confirm-ride" options={{ headerShown: false }} />
        <Stack.Screen name="book-ride" options={{ headerShown: false }} />
        <Stack.Screen name="test-payment" options={{ headerShown: false }} />
      </Stack>
    </PaystackProvider>
  );
};

export default Layout;
