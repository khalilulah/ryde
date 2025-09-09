import GoogleTextInput, {
  GoogleTextInputRef,
} from "@/components/GoogleTextInput";
import MapComponent from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LogBox,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
LogBox.ignoreLogs(["Clerk:"]);
LogBox.ignoreLogs(["search error:"]);
export default function Page() {
  const googleTextInputRef = useRef<GoogleTextInputRef>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useUser();
  const { signOut } = useAuth();
  const { data: recentRides, loading } = useFetch(
    `${API_URL}/(api)/ride/${user?.id}`
  );
  const { setDestinationLocation, setUserLocation } = useLocationStore();

  const handleSignOut = () => {
    signOut();

    setTimeout(() => {
      router.replace("/(auth)/sign-in");
    }, 1000);
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => handleSignOut(), style: "destructive" },
    ]);
  };

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };
  const flatListContentStyle = { paddingBottom: 100 };

  const ListHeader = useCallback(
    () => (
      <>
        <View className="flex flex-row items-center justify-between my-5">
          <Text className="text-2xl font-JakartaExtraBold capitalize">
            Welcome,{"  "}
            {user?.firstName} 👋
          </Text>
          <TouchableOpacity
            onPress={confirmLogout}
            className="justify-center items-center w-10 h-10 rounded-full bg-white"
          >
            <Image source={icons.out} className="w-4 h-4" />
          </TouchableOpacity>
        </View>
        <GoogleTextInput
          ref={googleTextInputRef}
          icon={icons.search}
          containerStyle="bg-white shadow-md shadow-neutral-300"
          handlePress={handleDestinationPress}
        />
        <>
          <Text className="text-xl font-JakartaBold mt-5 mb-3">
            Current Location
          </Text>
          <View className="flex flex-row items-center bg-transparent h-[300px]">
            <MapComponent />
          </View>
        </>
        <Text className="text-xl font-JakartaBold mt-5 mb-3">Recent Rides</Text>
      </>
    ),
    []
  );

  return (
    <SafeAreaView>
      <FlatList
        onScroll={() => googleTextInputRef.current?.hideResults()}
        scrollEventThrottle={16}
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={flatListContentStyle}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className=" flex w-40 h-40 self-center"
                />
                <Text>No recent ride found</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" />
              </>
            )}
          </View>
        )}
        ListHeaderComponent={ListHeader}
      />
    </SafeAreaView>
  );
}
