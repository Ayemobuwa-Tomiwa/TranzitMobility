import { useAuth } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import PaystackWebView from "react-native-paystack-webview";

import CustomButton from "@/components/CustomButton";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

const WalletScreen = () => {
  const { userId } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reference, setReference] = useState<string | null>(null);

  const loadWallet = async () => {
    if (!userId) return;

    setLoading(true);
    const res = await fetch(`${API_URL}/api/wallet/${userId}`);
    const data = await res.json();

    setBalance(data.balance ?? 0);
    setTransactions(data.transactions ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadWallet();
  }, [userId]);

  const startTopup = () => {
    const ref = `WLT-TOPUP-${Math.floor(Math.random() * 1_000_000)}-${Date.now()}`;
    setReference(ref);
  };

  const handlePaystackSuccess = async (tx: any) => {
    setLoading(true);

    await fetch(`${API_URL}/api/wallet/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: tx.reference,
        userId,
      }),
    });

    await loadWallet();
    setLoading(false);
    alert("Wallet topped up!");
  };

  return (
    <View className="flex-1 p-4 bg-black">
      <Text className="text-white text-xl">Wallet</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text className="text-white text-2xl mt-4">
            ₦{(balance / 100).toFixed(2)}
          </Text>

          <TextInput
            placeholder="Amount (NGN)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="bg-white p-3 rounded my-4"
          />

          <CustomButton title="Top up wallet" onPress={startTopup} />

          {reference && (
            <PaystackWebView
              paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY!}
              amount={Math.round(Number(amount) * 100)}
              reference={reference}
              autoStart
              onSuccess={handlePaystackSuccess}
              onCancel={() => setReference(null)}
            />
          )}

          <Text className="text-white mt-6">Transactions</Text>

          <FlatList
            data={transactions}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View className="py-2 border-b border-gray-700">
                <Text className="text-white">{item.description}</Text>
                <Text className="text-neutral-400">
                  ₦{(item.amount / 100).toFixed(2)}
                </Text>
                <Text className="text-neutral-500 text-xs">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

export default WalletScreen;
