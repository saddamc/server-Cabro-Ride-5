import axios from "axios";

// Define interfaces
interface ILocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  type: string;
}

interface NominatimResponse {
  place_id: string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: Record<string, string>;
}

// Helper to extract a meaningful name from address components
const getNameFromAddress = (item: NominatimResponse): string => {
  const address = item.address;
  
  if (!address) return "Unknown location";
  
  // Try to use the most specific named entity available
  return (
    address.building ||
    address.house_number ||
    address.road ||
    address.neighbourhood ||
    address.suburb ||
    address.town ||
    address.city ||
    address.county ||
    address.state ||
    "Unknown location"
  );
};

// Map OSM type to a more user-friendly category
const getLocationType = (type: string, osm_class: string): string => {
  if (type === "building" || type === "house" || type === "residential") return "Building";
  if (type === "restaurant" || type === "cafe" || type === "fast_food") return "Restaurant";
  if (type === "hotel" || type === "hostel" || type === "guest_house") return "Hotel";
  if (type === "supermarket" || type === "mall" || type === "marketplace") return "Shopping";
  if (type === "hospital" || type === "clinic" || type === "pharmacy") return "Healthcare";
  if (type === "school" || type === "college" || type === "university") return "Education";
  if (type === "bus_stop" || type === "station" || type === "airport") return "Transport";
  if (type === "park" || type === "garden") return "Park";
  if (osm_class === "highway") return "Road";
  if (osm_class === "natural") return "Natural";
  
  return "Location";
};

// Search for locations based on query string using Nominatim (OpenStreetMap)
const searchLocations = async (query: string): Promise<ILocation[]> => {
  try {
    // Use Nominatim for geocoding
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=5&countrycodes=bd`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "Ride-Cabro-App/1.0",
        },
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    // Transform the response to our format
    return response.data.map((item: NominatimResponse) => ({
      id: item.place_id,
      name: item.name || getNameFromAddress(item),
      address: item.display_name,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
      type: getLocationType(item.type, item.class),
    }));
  } catch {
    // Return empty array on error
    return [];
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ILocation | null> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "Ride-Cabro-App/1.0",
        },
      }
    );

    if (!response.data) {
      return null;
    }

    const data = response.data as NominatimResponse;
    return {
      id: data.place_id,
      name: data.name || getNameFromAddress(data),
      address: data.display_name,
      coordinates: [lng, lat],
      type: getLocationType(data.type, data.class),
    };
  } catch {
    // Return null on error
    return null;
  }
};

export const LocationService = {
  searchLocations,
  reverseGeocode,
};