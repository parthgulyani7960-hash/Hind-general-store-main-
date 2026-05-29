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
  // If API Key is provided, use Google Maps Geocoding API
  if (googleMapsApiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;

        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let pin_code = '';

        components.forEach((c: any) => {
          if (c.types.includes('street_number')) streetNumber = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_1')) state = c.long_name;
          if (c.types.includes('postal_code')) pin_code = c.long_name;
        });

        // Fallback for city if locality is missing
        if (!city) {
          const sublocality = components.find((c: any) => c.types.includes('sublocality'));
          if (sublocality) city = sublocality.long_name;
        }

        return {
          address: `${streetNumber} ${route}`.trim() || result.formatted_address,
          city,
          state,
          pin_code: pin_code.slice(0, 6),
          latitude: lat,
          longitude: lng
        };
      }
    } catch (error) {
      console.warn('Google Reverse Geocoding failed, falling back to Nominatim:', error);
    }
  }

  // Fallback to OpenStreetMap Nominatim
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
