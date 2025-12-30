import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { api } from "@/lib/api";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState<{
    state: "default" | "pending" | "success" | "failed";
    code: string;
    error: string;
  }>({
    state: "default",
    code: "",
    error: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerification((prev) => ({
        ...prev,
        state: "pending",
      }));
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.errors?.[0]?.longMessage ?? "Sign up failed");
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (result.status !== "complete") {
        setVerification((prev) => ({
          ...prev,
          state: "failed",
          error: "Verification failed. Please try again.",
        }));
        return;
      }

      await api("/user", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          clerkId: result.createdUserId,
        }),
      });

      await setActive({ session: result.createdSessionId });

      setVerification((prev) => ({
        ...prev,
        state: "success",
      }));
    } catch (err: any) {
      console.error(err);
      setVerification((prev) => ({
        ...prev,
        state: "failed",
        error: err?.errors?.[0]?.longMessage ?? "Verification failed",
      }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="flex-1 bg-black">
        <View className="relative w-full h-[120px]">
          <Text className="text-2xl text-white font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Name"
            placeholder="Enter name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, name: value }))
            }
          />

          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, email: value }))
            }
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry
            textContentType="password"
            value={form.password}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, password: value }))
            }
          />

          <CustomButton
            title="Sign Up"
            onPress={onSignUpPress}
            className="mt-6"
          />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-general-300 mt-10"
          >
            Signing up as a driver?{" "}
            <Text className="text-success-500">Click here</Text>
          </Link>

          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-success-500">Log In</Text>
          </Link>
        </View>

        {/* EMAIL VERIFICATION MODAL */}
        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-JakartaExtraBold text-2xl mb-2">
              Verification
            </Text>

            <Text className="font-Jakarta mb-5">
              We've sent a verification code to {form.email}.
            </Text>

            <InputField
              label="Code"
              icon={icons.lock}
              placeholder="123456"
              keyboardType="numeric"
              value={verification.code}
              onChangeText={(code) =>
                setVerification((prev) => ({ ...prev, code }))
              }
            />

            {verification.error ? (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            ) : null}

            <CustomButton
              title="Verify Email"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>

        {/* SUCCESS MODAL */}
        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />

            <Text className="text-3xl font-JakartaBold text-center">
              Verified
            </Text>

            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account.
            </Text>

            <CustomButton
              title="Browse Home"
              onPress={() => router.replace("/(root)/(tabs)/home")}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
