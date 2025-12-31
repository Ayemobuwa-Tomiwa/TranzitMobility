import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

/**
 * Generate driver markers around the user
 */
export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    return {
      ...driver, // spread FIRST to avoid TS2783
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
    };
  });
};

/**
 * Calculate map region
 */
export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (userLatitude == null || userLongitude == null) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (destinationLatitude == null || destinationLongitude == null) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  return {
    latitude: (userLatitude + destinationLatitude) / 2,
    longitude: (userLongitude + destinationLongitude) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };
};

/**
 * Calculate driver ETAs and pricing
 */
export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    userLatitude == null ||
    userLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null ||
    !directionsAPI
  ) {
    return;
  }

  try {
    const results = await Promise.all(
      markers.map(async (marker) => {
        const toUserRes = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`,
        );

        const toUserData = await toUserRes.json();
        const timeToUser =
          toUserData.routes?.[0]?.legs?.[0]?.duration?.value ?? 0;

        const toDestinationRes = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
        );

        const toDestinationData = await toDestinationRes.json();
        const timeToDestination =
          toDestinationData.routes?.[0]?.legs?.[0]?.duration?.value ?? 0;

        const totalMinutes = (timeToUser + timeToDestination) / 60;
        const price = Number((totalMinutes * 0.5).toFixed(2));

        return {
          ...marker,
          time: totalMinutes,
          price,
        };
      }),
    );

    return results;
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};
