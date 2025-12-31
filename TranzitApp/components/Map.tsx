import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { api } from "@/lib/api";
import { calculateDriverTimes, generateMarkersFromData } from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

const Map = () => {
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { selectedDriver, setDrivers } = useDriverStore();

  const [drivers, setLocalDrivers] = useState<Driver[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch drivers */
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const response = await api<{ data: Driver[] }>("/drivers");

        if (!Array.isArray(response.data)) {
          throw new Error("Invalid drivers payload");
        }

        const mappedDrivers: MarkerData[] = response.data.map((driver) => ({
          id: driver.id,
          latitude: driver.latitude,
          longitude: driver.longitude,
          title: `${driver.first_name} ${driver.last_name}`,
          profile_image_url: driver.profile_image_url,
          car_image_url: driver.car_image_url,
          car_seats: driver.car_seats,
          rating: driver.rating,
          first_name: driver.first_name,
          last_name: driver.last_name,
        }));

        setLocalDrivers(mappedDrivers);
      } catch (err) {
        console.error("Driver fetch failed:", err);
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  /** Generate markers */
  useEffect(() => {
    if (!userLatitude || !userLongitude || drivers.length === 0) return;

    const newMarkers = generateMarkersFromData({
      data: drivers,
      userLatitude,
      userLongitude,
    });

    setMarkers(newMarkers);
  }, [drivers, userLatitude, userLongitude]);

  /** Calculate ETAs */
  useEffect(() => {
    if (
      markers.length === 0 ||
      !userLatitude ||
      !userLongitude ||
      !destinationLatitude ||
      !destinationLongitude
    ) {
      return;
    }

    calculateDriverTimes({
      markers,
      userLatitude,
      userLongitude,
      destinationLatitude,
      destinationLongitude,
    }).then((updatedMarkers) => {
      setDrivers(updatedMarkers as unknown as MarkerData[]);
    });
  }, [
    markers,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    setDrivers,
  ]);

  /** Region */
  const region: Region | null = useMemo(() => {
    if (!userLatitude || !userLongitude || drivers.length === 0) return null;

    const latitudes = [
      userLatitude,
      ...drivers.slice(0, 3).map((d) => d.latitude),
    ];
    const longitudes = [
      userLongitude,
      ...drivers.slice(0, 3).map((d) => d.longitude),
    ];

    return {
      latitude: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
      longitude: (Math.max(...longitudes) + Math.min(...longitudes)) / 2,
      latitudeDelta:
        Math.abs(Math.max(...latitudes) - Math.min(...latitudes)) + 0.1,
      longitudeDelta:
        Math.abs(Math.max(...longitudes) - Math.min(...longitudes)) + 0.1,
    };
  }, [userLatitude, userLongitude, drivers]);

  if (loading || !region) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={region}
      showsUserLocation
      showsPointsOfInterest={false}
      userInterfaceStyle="light"
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          image={
            selectedDriver === Number(marker.id)
              ? icons.selectedMarker
              : icons.marker
          }
        />
      ))}

      {destinationLatitude && destinationLongitude && directionsAPI && (
        <MapViewDirections
          origin={{ latitude: userLatitude!, longitude: userLongitude! }}
          destination={{
            latitude: destinationLatitude,
            longitude: destinationLongitude,
          }}
          apikey={directionsAPI}
          strokeWidth={3}
          strokeColor="#0286FF"
        />
      )}
    </MapView>
  );
};

export default Map;
