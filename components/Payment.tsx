import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { usePaystack } from "react-native-paystack-webview";
import CustomButton from "./CustomButton";

const Payment = ({ amount, driverId, rideTime }: PaymentProps) => {
  const { popup } = usePaystack();
  const { user } = useUser();

  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();
  const { userId } = useAuth();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const createRide = async () => {
    try {
      const response = await fetchAPI(`${API_URL}/(api)/ride/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: Math.round(rideTime),
          fare_price: parseInt(`${amount}`) * 100,
          payment_status: "paid",
          driver_id: driverId,
          user_id: userId,
        }),
      });
      console.log("Ride created successfully:", response);
      return response;
    } catch (error) {
      console.error("Error creating ride:", error);
      throw error;
    }
  };

  const paynow = () => {
    popup.newTransaction({
      email: user?.emailAddresses[0].emailAddress || "alausaklitchy@gmail.com",
      amount: amount * 100,
      reference: `TXT_${Date.now()}`,

      onSuccess: async (res) => {
        console.log("Payment success", res);

        // Create ride only after successful payment
        if (user && userId) {
          try {
            await createRide();
            console.log("Ride booking completed successfully");
            // You might want to navigate to a success screen or update UI here
          } catch (error) {
            console.error("Failed to create ride after payment:", error);
            // Handle the error - maybe show an alert to user
            // You might want to refund or handle this edge case
          }
        }
      },

      onCancel: () => {
        console.log("Payment cancelled by user");
      },

      onError: (error) => {
        console.log("Payment error:", error);
      },

      onLoad: (res) => {
        console.log("Payment webview loaded:", res);
        console.log("Modal should be visible now");
      },
    });
  };

  return (
    <>
      <CustomButton onPress={paynow} title="Make Payment" />
    </>
  );
};

export default Payment;
