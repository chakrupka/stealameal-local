import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Text, RadioButton, List, Card } from 'react-native-paper';
import axios from 'axios';
import useStore from '../store';
import { useLocation } from '../contexts/LocationContext';
import LocationToggle from '../components/LocationToggle';

export const getFriendLocationInfo = (friend, users) => {
  if (!friend || !users)
    return { available: false, lastUpdated: null, location: null };

  const friendUser = users.find((u) => u.userID === friend.friendID);
  if (!friendUser)
    return { available: false, lastUpdated: null, location: null };

  const available = friend.locationAvailable;
  const lastUpdated = friendUser.locationUpdatedAt
    ? new Date(friendUser.locationUpdatedAt)
    : null;
  const location = friendUser.location;

  return { available, lastUpdated, location };
};

export default function LocationUpdate({ navigation }) {
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const updateUserProfile = useStore(
    (state) => state.userSlice.updateUserProfile,
  );
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );
  const { getCurrentLocation } = useLocation();

  const [selectedLocation, setSelectedLocation] = useState(
    currentUser?.location || '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const locations = [
    { key: 'foco', label: 'Class of 1953 Commons (FOCO)' },
    { key: 'collis', label: 'Collis Center' },
    { key: 'hop', label: 'Hopkins Center (HOP)' },
    { key: 'fern', label: 'Fern Coffee & Tea' },
    { key: 'novack', label: 'Novack Cafe' },
    { key: 'ghost', label: 'Offline / Not sharing' },
  ];

  useEffect(() => {
    if (currentUser?.locationUpdatedAt) {
      try {
        const date = new Date(currentUser.locationUpdatedAt);

        if (isNaN(date.getTime())) {
          console.error(
            'Invalid date from timestamp:',
            currentUser.locationUpdatedAt,
          );
        } else {
          setLastUpdated(date);
        }
      } catch (err) {
        console.error('Error parsing date:', err);
      }
    }
  }, [currentUser]);

  const formatTimeSince = (date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins === 1) return '1 minute ago';
    if (diffInMins < 60) return `${diffInMins} minutes ago`;

    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const isLocationExpired = () => {
    if (!lastUpdated) return true;

    const now = new Date();
    const diffInMs = now - lastUpdated;
    const diffInMins = diffInMs / (1000 * 60);

    // Location expires after 90 mins
    return diffInMins >= 90;
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation) {
      setError('Please select a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!currentUser || !currentUser._id || !currentUser.idToken) {
        throw new Error('User information not available');
      }

      const result = await updateUserProfile({
        location: selectedLocation,
      });

      if (result.success) {
        const now = new Date();
        setLastUpdated(now);

        await refreshUserProfile();

        const locationLabel =
          locations.find((loc) => loc.key === selectedLocation)?.label ||
          selectedLocation;

        alert(
          `Location updated to ${locationLabel} at ${now.toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute: '2-digit',
            },
          )}`,
        );

        navigation.goBack();
      } else {
        setError(result.error || 'Failed to update location');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // automatically detect current location
  const handleDetectLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const detectedLocation = await getCurrentLocation();

      if (detectedLocation) {
        setSelectedLocation(detectedLocation);
      } else {
        setError('Could not detect your location. Please select manually.');
      }
    } catch (err) {
      setError('Failed to detect location: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // States for tracking friend location data
  const [friendsData, setFriendsData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Function to fetch friend data
  const fetchFriendLocations = async () => {
    if (!currentUser || !currentUser.friendsList || !currentUser.idToken)
      return;

    setLoadingFriends(true);
    try {
      // Get all users from the API using environment-aware config
      const usersResponse = await axios.get(`${USER_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${currentUser.idToken}`,
        },
      });

      if (usersResponse.status === 200) {
        const users = usersResponse.data;
        setAllUsers(users);

        // Process friend location data
        const friendsWithLocation = currentUser.friendsList.map((friend) => {
          const locationInfo = getFriendLocationInfo(friend, users);
          return {
            ...friend,
            locationInfo,
          };
        });

        setFriendsData(friendsWithLocation);
      }
    } catch (error) {
      console.error('Error fetching friend locations:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchFriendLocations();
  }, [currentUser]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerText}>Update Your Location</Text>

      <Text style={styles.subtitle}>
        Select where you are now. Your location will be visible to friends for
        90 minutes.
      </Text>

      <LocationToggle />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        mode="outlined"
        onPress={handleDetectLocation}
        loading={loading}
        disabled={loading}
        style={styles.detectButton}
        icon="crosshairs-gps"
      >
        Detect My Location
      </Button>

      <View style={styles.locationContainer}>
        <RadioButton.Group
          onValueChange={(value) => setSelectedLocation(value)}
          value={selectedLocation}
        >
          {locations.map((location) => (
            <List.Item
              key={location.key}
              title={location.label}
              left={() => (
                <RadioButton
                  value={location.key}
                  status={
                    selectedLocation === location.key ? 'checked' : 'unchecked'
                  }
                />
              )}
              onPress={() => setSelectedLocation(location.key)}
              style={styles.locationItem}
            />
          ))}
        </RadioButton.Group>
      </View>

      <Button
        mode="contained"
        onPress={handleUpdateLocation}
        loading={loading}
        disabled={loading}
        style={styles.updateButton}
      >
        Update My Location
      </Button>

      {lastUpdated && (
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {formatTimeSince(lastUpdated)}
          </Text>
          {isLocationExpired() && (
            <Text style={styles.expiredText}>
              Your location has expired and is no longer visible to friends
            </Text>
          )}
        </View>
      )}

      {currentUser?.friendsList?.length > 0 && (
        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>Friend Locations</Text>

          {loadingFriends ? (
            <Text style={styles.loadingText}>Loading friend locations...</Text>
          ) : (
            friendsData.map((friend) => {
              const { available, lastUpdated, location } = friend.locationInfo;
              const locationLabel =
                locations.find((loc) => loc.key === location)?.label ||
                location;

              return (
                <Card key={friend.friendID} style={styles.friendCard}>
                  <Card.Content>
                    <Text style={styles.friendName}>
                      {allUsers.find((u) => u.userID === friend.friendID)
                        ?.firstName || 'Friend'}
                    </Text>

                    {available && location ? (
                      <>
                        <Text style={styles.friendLocation}>
                          Location: {locationLabel}
                        </Text>
                        {lastUpdated && (
                          <Text style={styles.friendUpdateTime}>
                            Updated: {formatTimeSince(lastUpdated)}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.unavailableText}>
                        No location shared
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}

          <Button
            mode="outlined"
            onPress={fetchFriendLocations}
            style={styles.refreshButton}
          >
            Refresh Friend Locations
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  locationContainer: {
    marginVertical: 20,
  },
  locationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  updateButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: '#5C4D7D',
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
    textAlign: 'center',
  },
  lastUpdatedContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  lastUpdatedText: {
    marginTop: 5,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  expiredText: {
    marginTop: 8,
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: '500',
  },
  friendsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  friendCard: {
    marginBottom: 10,
    elevation: 2,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  friendLocation: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
  },
  friendUpdateTime: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  unavailableText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#777',
  },
  refreshButton: {
    marginTop: 15,
    alignSelf: 'center',
    marginBottom: 20,
  },
  detectButton: {
    marginTop: 15,
    marginBottom: 5,
  },
});
