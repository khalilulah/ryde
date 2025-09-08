import { icons } from "@/constants";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "./Map";

const RideLayout = ({
  title,
  children,
  snapPoints,
}: {
  title: string;
  children: React.ReactNode;
  snapPoints: string;
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{ flex: 1 }} className="bg-transparent">
        {/* Main content container */}
        <View className="flex-1">
          {/* Map and header section */}

          {/* Header */}
          <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  className="w-6 h-6"
                />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-JakartaSemiBold ml-5">
              {title || "Go Back"}
            </Text>
          </View>

          {/* Map Component */}
          <MapComponent />
          <Text>Map temporarily disabled for testing</Text>

          {/* Bottom Sheet - now properly positioned */}
          {/* <BottomSheet
            ref={bottomSheetRef}
            snapPoints={["40%", "85%"]}
            index={snapPoints}
            keyboardBehavior="extend"
          >
            <BottomSheetView style={{ flex: 1, padding: 20 }}>
            </BottomSheetView>
          </BottomSheet> */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "white",
              padding: 20,
              height: snapPoints, // Adjust based on your snapPoints
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              elevation: 5, // Android shadow
              shadowColor: "#000", // iOS shadow
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
          >
            {children}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default RideLayout;
