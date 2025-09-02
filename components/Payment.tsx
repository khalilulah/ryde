import { PaymentProps } from "@/types/type";
import { useUser } from "@clerk/clerk-expo";
import { usePaystack } from "react-native-paystack-webview";
import CustomButton from "./CustomButton";

const Payment = ({ amount }: PaymentProps) => {
  const { popup } = usePaystack();
  const { user } = useUser();
  const paynow = () => {
    popup.newTransaction({
      email: user?.emailAddresses[0].emailAddress || "alausaklitchy@gmail.com",
      amount: amount * 100,
      reference: `TXT_${Date.now()}`,

      onSuccess: async (res) => {
        console.log("success", res);
      },
      onCancel: () => console.log("user cancelled"),
      onError: (error) => console.log("webview Error:", error),
      onLoad: (res) => {
        console.log("webview loaded:", res);
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
