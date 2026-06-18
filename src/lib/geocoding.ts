import { toast } from 'react-hot-toast';

export interface GeocodeResult {
  address: string;
  city: string;
  state: string;
  pin_code: string;
  latitude: number;
  longitude: number;
}

/**
 * Uses the browser's Geolocation API to get current coordinates
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
};

/**
 * Reverse geocodes coordinates to a human-readable address
 * Falls back to OpenStreetMap Nominatim if Google Maps key is missing or fails
 */
export const reverseGeocode = async (
  lat: number, 
  lng: number, 
  googleMapsApiKey?: string
): Promise<GeocodeResult> => {
  try {
    const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Backend proxy geocoding failed, trying direct fallback:', error);
  }

  // Fallback to direct Nominatim if backend proxy is temporarily unreachable
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await response.json();

  if (data && data.address) {
    const addr = data.address;
    const city = addr.city || addr.town || addr.village || '';
    const road = addr.road || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || '';

    return {
      address: `${road}${neighbourhood ? ', ' + neighbourhood : ''}`.trim() || data.display_name,
      city: city,
      state: addr.state || '',
      pin_code: addr.postcode?.replace(/\D/g, '').slice(0, 6) || '',
      latitude: lat,
      longitude: lng
    };
  }

  throw new Error("Could not determine address from coordinates");
};

/**
 * Main function to autofill address fields
 */
export const autofillLocation = async (googleMapsApiKey?: string): Promise<GeocodeResult | null> => {
  const loadingToast = toast.loading('Accessing GPS sensors...');
  
  try {
    const position = await getCurrentPosition();
    toast.loading('Resolving address from coordinates...', { id: loadingToast });
    
    const result = await reverseGeocode(
      position.coords.latitude, 
      position.coords.longitude, 
      googleMapsApiKey
    );
    
    toast.success('Location identified!', { id: loadingToast });
    return result;
  } catch (error: any) {
    console.error('Autofill Error:', error);
    toast.error(error.message || 'Failed to fetch location', { id: loadingToast });
    return null;
  }
};
