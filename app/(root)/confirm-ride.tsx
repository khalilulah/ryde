import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (drivers && drivers.length > 0) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [drivers]);

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center py-20">
      <ActivityIndicator size="large" color="#0286ff" />
      <Text className="mt-4 text-gray-600 text-lg">
        Finding available drivers...
      </Text>
    </View>
  );

  const renderDriversList = () => (
    <FlatList
      data={drivers}
      renderItem={({ item }) => (
        <DriverCard
          selected={selectedDriver!}
          setSelected={() => setSelectedDriver(Number(item.id)!)}
          item={item}
        />
      )}
      ListFooterComponent={() => (
        <View className="mx-5 mt-10">
          <CustomButton
            title="Select Ride"
            onPress={() => router.push("/(root)/book-ride")}
          />
        </View>
      )}
    />
  );

  return (
    <RideLayout title="Choose a Driver" snapPoints={"65%"}>
      {loading ? renderLoadingState() : renderDriversList()}
    </RideLayout>
  );
};

export default ConfirmRide;
