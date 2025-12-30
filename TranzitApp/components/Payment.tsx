import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import PaystackWebView from "react-native-paystack-webview";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { api } from "@/lib/api";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/payment";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
  paymentMethod,
  userId,
}: PaymentProps) => {
  const {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const [success, setSuccess] = useState(false);
  const paystackRef = useRef<any>(null);

  const generateReference = () =>
    `TRNZT-${Math.floor(Math.random() * 1_000_000)}-${Date.now()}`;

  // ----------------------------------------
  // PAYSTACK PAYMENT SUCCESS
  // ----------------------------------------
  const handlePaystackSuccess = async (tx: any) => {
    try {
      const verify = await api<{ success: boolean }>("/api/wallet/verify", {
        method: "POST",
        body: JSON.stringify({
          reference: tx.transactionRef?.reference,
          userId,
        }),
      });

      if (!verify.success) {
        Alert.alert("Payment verification failed");
        return;
      }

      await api("/api/ride/create", {
        method: "POST",
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: rideTime.toFixed(0),
          fare_price: amount * 100,
          payment_status: "paid",
          driver_id: driverId,
          user_id: userId,
        }),
      });

      setSuccess(true);
    } catch (err) {
      console.log(err);
      Alert.alert("Error verifying payment");
    }
  };

  // ----------------------------------------
  // WALLET PAYMENT
  // ----------------------------------------
  const handleWalletPay = async () => {
    try {
      const res = await api<{ success: boolean; error?: string }>(
        "/api/wallet/pay",
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            amount: amount * 100,
            ridePayload: {
              origin_address: userAddress,
              destination_address: destinationAddress,
              origin_latitude: userLatitude,
              origin_longitude: userLongitude,
              destination_latitude: destinationLatitude,
              destination_longitude: destinationLongitude,
              ride_time: rideTime.toFixed(0),
              driver_id: driverId,
            },
          }),
        },
      );

      if (!res.success) {
        Alert.alert(res.error || "Wallet payment failed");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.log(err);
      Alert.alert("Wallet payment error");
    }
  };

  return (
    <>
      {paymentMethod === "paystack" && (
        <PaystackWebView
          paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY!}
          amount={amount * 100}
          billingEmail={email}
          billingName={fullName}
          ref={paystackRef}
          onCancel={() => Alert.alert("Payment Cancelled")}
          onSuccess={handlePaystackSuccess}
          autoStart={false}
          reference={generateReference()}
        />
      )}

      <CustomButton
        title="Confirm Ride"
        className="my-10"
        onPress={() => {
          if (paymentMethod === "wallet") handleWalletPay();
          else paystackRef.current?.startTransaction();
        }}
      />

      {success && (
        <View className="flex items-center justify-center p-7 bg-white rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Booking placed successfully
          </Text>
          <CustomButton
            title="Back Home"
            className="mt-5"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
          />
        </View>
      )}
    </>
  );
};

export default Payment;
