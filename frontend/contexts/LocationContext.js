import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';
import useStore from '../store';
import axios from 'axios';

// we didn't have a contexts folder but online it says it is good practice so i created one

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const updateUserProfile = useStore(
    (state) => state.userSlice.updateUserProfile,
  );
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );

  useEffect(() => {
    (async () => {
      // Check if location enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      setLocationEnabled(isEnabled);

      if (!isEnabled) {
        setErrorMsg('Location services are disabled on your device');
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');

      // Initialize based on user settings
      if (
        currentUser &&
        currentUser.location &&
        currentUser.location !== 'ghost'
      ) {
        setIsTracking(true);
      }
    })();
  }, []);

  // Request location permissions
  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setErrorMsg('Failed to request location permissions');
      return false;
    }
  };

  // Get current location and map it to a campus location
  const getCurrentLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        setErrorMsg('Location permission not granted');
        return null;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(location);

      // Map coordinates to a named location
      const mappedLocation = mapCoordinatesToLocation(location.coords);
      return mappedLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      setErrorMsg('Failed to get current location');
      return null;
    }
  };

  const mapCoordinatesToLocation = (coords) => {
    const locations = [
      {
        id: 'foco',
        name: 'Class of 1953 Commons (FOCO)',
        lat: 43.7030422,
        lng: -72.2909885,
        radiusMeters: 50,
      },
      {
        id: 'collis',
        name: 'Collis Center',
        lat: 43.7027412,
        lng: -72.2900297,
        radiusMeters: 50,
      },
      {
        id: 'hop',
        name: 'Hopkins Center (HOP)',
        lat: 43.7016,
        lng: -72.2881,
        radiusMeters: 50,
      },
      {
        id: 'fern',
        name: 'Fern Coffee & Tea',
        lat: 43.70488,
        lng: -72.294709,
        radiusMeters: 40,
      },
      {
        id: 'novack',
        name: 'Novack Cafe',
        lat: 43.7057,
        lng: -72.2887,
        radiusMeters: 40,
      },
    ];

    for (const loc of locations) {
      const distance = getDistanceInMeters(
        coords.latitude,
        coords.longitude,
        loc.lat,
        loc.lng,
      );

      // If within radius, return location
      if (distance <= loc.radiusMeters) {
        return loc.id;
      }
    }

    // fallback
    return 'campus';
  };

  // Calculate distance between two coordinates in meters - GPT
  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Toggle location tracking
  const toggleLocationTracking = async (enabled) => {
    try {
      if (enabled) {
        // Check/request permissions
        if (!hasPermission) {
          const granted = await requestPermissions();
          if (!granted) {
            setErrorMsg('Location permission not granted');
            return false;
          }
        }

        // Get current location and update server
        const locationId = await getCurrentLocation();
        if (!locationId) {
          setErrorMsg('Could not determine your location');
          return false;
        }

        const result = await updateUserProfile({
          location: locationId,
        });

        if (result.success) {
          setIsTracking(true);
          await refreshUserProfile();
          return true;
        } else {
          setErrorMsg(result.error || 'Failed to update location');
          return false;
        }
      } else {
        // Turn off location sharing
        const result = await updateUserProfile({
          location: 'ghost',
        });

        if (result.success) {
          setIsTracking(false);
          await refreshUserProfile();
          return true;
        } else {
          setErrorMsg(result.error || 'Failed to update location');
          return false;
        }
      }
    } catch (error) {
      console.error('Error toggling location tracking:', error);
      setErrorMsg('Failed to toggle location tracking');
      return false;
    }
  };

  // Background location update function
  const updateLocationInBackground = async () => {
    if (!isTracking) return;

    try {
      const locationId = await getCurrentLocation();
      if (locationId && locationId !== currentUser?.location) {
        await updateUserProfile({
          location: locationId,
        });
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error updating location in background:', error);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        locationEnabled,
        hasPermission,
        isTracking,
        errorMsg,
        getCurrentLocation,
        toggleLocationTracking,
        updateLocationInBackground,
        requestPermissions,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
