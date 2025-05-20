import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useLocation } from '../contexts/LocationContext';
import useStore from '../store';

export default function LocationToggle() {
  const {
    locationEnabled,
    hasPermission,
    isTracking,
    errorMsg,
    toggleLocationTracking,
    requestPermissions,
  } = useLocation();

  const [isTogglingLocation, setIsTogglingLocation] = useState(false);
  const currentUser = useStore((state) => state.userSlice.currentUser);

  const handleToggle = async (value) => {
    setIsTogglingLocation(true);

    try {
      // If don't have permission yet
      if (value && !hasPermission) {
        const permissionGranted = await requestPermissions();
        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'Location permissions are needed to share your location. Please enable location permissions in your device settings.',
            [{ text: 'OK' }],
          );
          setIsTogglingLocation(false);
          return;
        }
      }

      // Toggle location tracking
      const success = await toggleLocationTracking(value);

      if (!success && errorMsg) {
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('Error toggling location:', error);
      Alert.alert('Error', 'Failed to toggle location tracking');
    } finally {
      setIsTogglingLocation(false);
    }
  };

  if (!locationEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Location services are disabled on your device. Please enable them in
          your device settings to use this feature.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>
          {isTracking
            ? 'Your location is being shared'
            : 'Your location is not being shared'}
        </Text>
        <Switch
          value={isTracking}
          onValueChange={handleToggle}
          disabled={isTogglingLocation}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isTracking ? '#6750a4' : '#f4f3f4'}
        />
      </View>

      {isTracking && (
        <Text style={styles.statusText}>
          Your friends can see your location for 90 minutes after each update
        </Text>
      )}

      {!isTracking && (
        <Text style={styles.statusText}>
          When enabled, your friends will be able to see your location on campus
        </Text>
      )}

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});
