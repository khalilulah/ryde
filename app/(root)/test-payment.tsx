import Payment from "@/components/Payment";
import React from "react";
import { Text } from "react-native";

const TestPayment = () => {
  return (
    <>
      <Text>TestPayment</Text>
      <Payment amount={25} />
    </>
  );
};

export default TestPayment;
