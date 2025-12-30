import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import Payment from "@/components/Payment";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";

const BookRide = () => {
  const { user } = useUser();
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();

  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet">(
    "paystack",
  );

  const [walletBalance, setWalletBalance] = useState(0);

  const driverDetails = drivers?.find((d) => Number(d.id) === selectedDriver);

  // LOAD WALLET BALANCE
  useEffect(() => {
    async function loadWallet() {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.id)
        .single();

      setWalletBalance(data?.balance ?? 0);
    }

    loadWallet();
  }, []);

  return (
    <RideLayout title="Book Ride">
      <>
        <Text className="text-xl font-JakartaSemiBold mb-3">
          Ride Information
        </Text>

        {/* Driver Info */}
        <View className="flex items-center mt-10">
          <Image
            source={{ uri: driverDetails?.profile_image_url }}
            className="w-28 h-28 rounded-full"
          />

          <View className="flex-row mt-5 items-center">
            <Text className="text-lg font-JakartaSemiBold">
              {driverDetails?.title}
            </Text>

            <View className="flex-row items-center ml-2">
              <Image source={icons.star} className="w-5 h-5" />
              <Text className="ml-1">{driverDetails?.rating}</Text>
            </View>
          </View>
        </View>

        {/* Ride Details... */}
        <View className="flex w-full items-start mt-5">
          <Text className="text-lg font-JakartaRegular">
            From: {userAddress}
          </Text>
          <Text className="text-lg font-JakartaRegular mt-3">
            To: {destinationAddress}
          </Text>
        </View>

        {/* PAYMENT METHOD TOGGLE */}
        <View className="flex-row items-center mt-7">
          <TouchableOpacity
            onPress={() => setPaymentMethod("paystack")}
            className={`p-2 rounded ${
              paymentMethod === "paystack" ? "bg-white" : ""
            }`}
          >
            <Text>Paystack</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod("wallet")}
            className={`p-2 rounded ml-3 ${
              paymentMethod === "wallet" ? "bg-white" : ""
            }`}
          >
            <Text>Wallet (₦{(walletBalance / 100).toFixed(2)})</Text>
          </TouchableOpacity>
        </View>

        {/* PAYMENT COMPONENT */}
        <Payment
          fullName={user?.fullName!}
          email={user?.emailAddresses[0].emailAddress!}
          amount={Number(driverDetails?.price!)} // convert to number
          driverId={driverDetails?.id! as number} // cast if you know it's number
          rideTime={driverDetails?.time!}
          userId={user?.id!}
          paymentMethod={paymentMethod}
        />
      </>
    </RideLayout>
  );
};

export default BookRide;
