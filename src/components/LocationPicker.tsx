import React, { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onLocationFound: (lat: number, lng: number) => void;
  className?: string;
}

export default function LocationPicker({ onLocationFound, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }
    setLoading(true);
    toast.loading('Fetching location...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationFound(latitude, longitude);
        toast.success('Location acquired', { id: 'geo' });
        setLoading(false);
      },
      (error) => {
        let errorMsg = 'Could not fetch location';
        if (error.code === 1) errorMsg = 'Location permission denied';
        else if (error.code === 3) errorMsg = 'Connection timed out';
        
        toast.error(errorMsg, { id: 'geo' });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
    // Notify user that high accuracy can take time
    setTimeout(() => {
      if (loading) {
        toast('Waiting for satellite signal...', { id: 'geo', icon: '📡' });
      }
    }, 5000);
  };

  return (
    <button
      type="button"
      onClick={getCurrentLocation}
      disabled={loading}
      className={`flex items-center space-x-2 text-primary font-bold text-sm hover:underline ${className}`}
    >
      {loading ? <Loader size={16} className="animate-spin" /> : <MapPin size={16} />}
      <span>{loading ? 'Fetching...' : 'Use Current Location'}</span>
    </button>
  );
}
