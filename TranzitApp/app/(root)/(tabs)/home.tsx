import { useUser, useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { api } from "@/lib/api";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";

const Home = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setDestinationLocation } = useLocationStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);

  /**
   * Sign out
   */
  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  /**
   * Fetch recent rides
   */
  useEffect(() => {
    if (!user?.id) return;

    setRidesLoading(true);

    api<{ rides: Ride[] }>(`/ride/${user.id}`)
      .then((res) => {
        setRecentRides(res.rides);
      })
      .catch((error) => {
        console.error("Ride fetch error:", error);
        setRecentRides([]);
      })
      .finally(() => {
        setRidesLoading(false);
      });
  }, [user?.id]);

  /**
   * Get user location
   */
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setHasPermission(false);
          return;
        }

        setHasPermission(true);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address
            ? `${address.name}, ${address.region}`
            : "Current location",
        });
      } catch (error) {
        console.error("Location error:", error);
        setHasPermission(false);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  /**
   * Destination selection
   */
  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <FlatList
        data={recentRides.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(_, index) => index.toString()}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            {!ridesLoading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
                <Text className="text-sm text-white">
                  No recent rides found
                </Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#fff" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold text-white">
                Welcome {user?.firstName}
              </Text>

              {/* Wallet balance display */}
              <View className="px-2 rounded-full bg-general-400">
                <Text className="text-lg font-JakartaBold text-white">
                  ₦0.00
                </Text>
              </View>
            </View>

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md"
              handlePress={handleDestinationPress}
            />

            <Text className="text-xl font-JakartaBold mt-5 mb-3 text-white">
              Your current location
            </Text>

            <View className="h-[300px] rounded-2xl overflow-hidden">
              {locationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : hasPermission ? (
                <Map />
              ) : (
                <Text className="text-white text-center">
                  Location permission is required to show the map
                </Text>
              )}
            </View>

            <Text className="text-xl font-JakartaBold mt-5 mb-3 text-white">
              Recent Rides
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
