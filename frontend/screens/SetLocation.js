import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { USER_API_URL } from '../configs/api-config';
import styles from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';

export default function SetLocation({ navigation, route }) {
  const [selectedLocation, setSelectedLocation] = useState('');

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.location) {
      console.log('Current location:', currentUser.location);
      setSelectedLocation(currentUser.location);
    }
  }, [currentUser]);

  const locations = [
    {
      id: 'foco',
      name: 'Class of 1953 Commons (FOCO)',
      icon: 'silverware-fork-knife',
    },
    {
      id: 'collis',
      name: 'Collis Center',
      icon: 'food',
    },
    {
      id: 'hop',
      name: 'Hopkins Center (HOP)',
      icon: 'theater',
    },
    {
      id: 'fern',
      name: 'Fern Coffee & Tea',
      icon: 'coffee',
    },
    {
      id: 'ghost',
      name: 'Ghost (offline)',
      icon: 'ghost',
    },
  ];

  const handleSetLocation = async () => {
    if (!selectedLocation) return;

    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('User information not available');
      }

      console.log('Updating location for user:', currentUser._id);
      console.log('New location:', selectedLocation);

      const response = await axios.patch(
        `${USER_API_URL}/users/${currentUser._id}`,
        { location: selectedLocation },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.idToken}`,
          },
        },
      );

      console.log('Update response:', response.data);

      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      const locationName =
        locations.find((loc) => loc.id === selectedLocation)?.name ||
        selectedLocation;

      navigation.navigate('WhatNow', {
        message: `Your location has been updated to ${locationName}`,
      });
    } catch (error) {
      console.error('Error updating location:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      Alert.alert(
        'Update Failed',
        'Could not update your location. Please try again later.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNav navigation={navigation} title="Set Your Location" />

      <ScrollView style={localStyles.scrollView}>
        <View style={{ height: 80 }} />
        <View style={localStyles.contentContainer}>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                localStyles.locationCard,
                selectedLocation === location.id && localStyles.selectedCard,
              ]}
              onPress={() => setSelectedLocation(location.id)}
            >
              <View style={localStyles.iconContainer}>
                <MaterialCommunityIcons
                  name={location.icon}
                  size={36}
                  color="#555"
                />
              </View>
              <Text style={localStyles.locationName}>{location.name}</Text>
            </TouchableOpacity>
          ))}

          <View style={localStyles.buttonContainer}>
            <Button
              mode="contained"
              style={localStyles.updateButton}
              loading={loading}
              disabled={loading || !selectedLocation || !currentUser}
              onPress={handleSetLocation}
              labelStyle={localStyles.buttonLabel}
            >
              Update My Location
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,

    gap: 15,
  },
  locationCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedCard: {
    backgroundColor: '#e9e6ff',
    borderWidth: 2,
    borderColor: '#6750a4',
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 0,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  updateButton: {
    width: '80%',
    borderRadius: 15,
    backgroundColor: '#6750a4',
  },
  buttonLabel: {
    fontSize: 16,
    padding: 8,
  },
});
