import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { api } from "@/lib/api";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
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

  // Debugging: print user location values
  useEffect(() => {
    console.log(
      "User Latitude: ",
      userLatitude,
      "User Longitude: ",
      userLongitude,
    );
  }, [userLatitude, userLongitude]);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api<{ data: Driver[] }>("/drivers");
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid drivers payload");
        }

        // Map the Driver data to MarkerData
        const mappedDrivers: MarkerData[] = response.data.map((driver) => ({
          id: driver.id,
          latitude: driver.latitude, // Assuming `latitude` and `longitude` are part of the response
          longitude: driver.longitude, // Same here
          title: `${driver.first_name} ${driver.last_name}`,
          profile_image_url: driver.profile_image_url,
          car_image_url: driver.car_image_url,
          car_seats: driver.car_seats,
          rating: driver.rating,
          first_name: driver.first_name,
          last_name: driver.last_name,
        }));

        setLocalDrivers(mappedDrivers); // Set the drivers as MarkerData
      } catch (err) {
        console.error("Driver fetch failed:", err);
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Generate markers
  useEffect(() => {
    if (userLatitude == null || userLongitude == null) return;
    if (drivers.length === 0) return;

    const newMarkers = generateMarkersFromData({
      data: drivers,
      userLatitude,
      userLongitude,
    });
    setMarkers(newMarkers);
  }, [drivers, userLatitude, userLongitude]);

  // Calculate ETA & distance
  useEffect(() => {
    if (
      markers.length === 0 ||
      userLatitude == null ||
      userLongitude == null ||
      destinationLatitude == null ||
      destinationLongitude == null
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
      setDrivers(updatedMarkers as MarkerData[]);
    });
  }, [
    markers,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    setDrivers,
  ]);

  // Debugging: print markers data
  useEffect(() => {
    console.log("Markers: ", markers);
  }, [markers]);

  // Region (memoized + validated)
  const region: Region | null = useMemo(() => {
    if (userLatitude == null || userLongitude == null || drivers.length === 0)
      return null;

    // Sort drivers by proximity to the user
    const sortedDrivers = drivers
      .map((driver) => ({
        ...driver,
        distance: Math.sqrt(
          Math.pow(driver.latitude - userLatitude, 2) +
            Math.pow(driver.longitude - userLongitude, 2),
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    // Get the 3 closest drivers
    const closestDrivers = sortedDrivers.slice(0, 3);

    // Find the bounds for the map
    const latitudes = [
      userLatitude,
      ...closestDrivers.map((driver) => driver.latitude),
    ];
    const longitudes = [
      userLongitude,
      ...closestDrivers.map((driver) => driver.longitude),
    ];

    const maxLat = Math.max(...latitudes);
    const minLat = Math.min(...latitudes);
    const maxLng = Math.max(...longitudes);
    const minLng = Math.min(...longitudes);

    const latitudeDelta = Math.abs(maxLat - minLat) + 0.1; // adding a margin for zoom
    const longitudeDelta = Math.abs(maxLng - minLng) + 0.1; // adding a margin for zoom

    const centerLat = (maxLat + minLat) / 2;
    const centerLng = (maxLng + minLng) / 2;

    const regionData = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta,
      longitudeDelta,
    };

    console.log("Region: ", regionData); // Debug the region value
    return regionData;
  }, [userLatitude, userLongitude, drivers]);

  // Guards
  if (loading || userLatitude == null || userLongitude == null || !region) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1 }}
      mapType="mutedStandard"
      showsUserLocation
      showsPointsOfInterest={false}
      initialRegion={region} // Pass the updated region here
      userInterfaceStyle="light"
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedDriver === Number(marker.id)
              ? icons.selectedMarker
              : icons.marker
          }
        />
      ))}
      {destinationLatitude != null &&
        destinationLongitude != null &&
        directionsAPI && (
          <>
            <Marker
              key="destination"
              coordinate={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              title="Destination"
              image={icons.pin}
            />
            <MapViewDirections
              origin={{ latitude: userLatitude, longitude: userLongitude }}
              destination={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              apikey={directionsAPI}
              strokeColor="#0286FF"
              strokeWidth={3}
            />
          </>
        )}
    </MapView>
  );
};

export default Map;
