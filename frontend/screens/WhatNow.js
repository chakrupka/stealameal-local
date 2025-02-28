import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text } from 'react-native-paper';
import styles from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';

export default function WhatNow({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const message = route.params?.message || null;
  const [showMessage, setShowMessage] = useState(!!message);

  // Get current user location from store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const userLocation = currentUser?.location || 'Not set';

  // Format location for display
  const formatLocation = (location) => {
    if (!location || location === 'Not set') return 'Not set';
    if (location === 'ghost') return 'Offline';

    // Capitalize first letter
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  // Hide success message after a timeout
  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="What Now?"
        profilePic={profilePic}
      />

      <View style={styles.content}>
        {showMessage && (
          <View style={localStyles.messageCard}>
            <Text style={localStyles.messageText}>{message}</Text>
          </View>
        )}

        <View style={localStyles.locationContainer}>
          <Text style={localStyles.locationLabel}>Your current location: </Text>
          <Text style={localStyles.locationValue}>
            {formatLocation(userLocation)}
          </Text>
          <TouchableOpacity
            style={localStyles.updateButton}
            onPress={() => navigation.navigate('SetLocation', { profilePic })}
          >
            <Text style={localStyles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          style={localStyles.actionButton}
          onPress={() => navigation.navigate('PingFriends', { profilePic })}
        >
          Ping Friends Now
        </Button>
        <Button
          mode="contained"
          style={localStyles.actionButton}
          onPress={() => navigation.navigate('ScheduleMeal', { profilePic })}
        >
          Schedule in Advance
        </Button>
        <Button
          mode="contained"
          style={localStyles.actionButton}
          onPress={() =>
            navigation.navigate('AddFriendsScreen', { profilePic })
          }
        >
          Add Friends
        </Button>
        <Button
          mode="contained"
          style={localStyles.actionButton}
          onPress={() =>
            navigation.navigate('FriendRequestsScreen', { profilePic })
          }
        >
          View Friend Requests
        </Button>
        <Button
          mode="contained"
          style={localStyles.actionButton}
          onPress={() => navigation.navigate('CampusMap', { profilePic })}
        >
          Campus Map
        </Button>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  messageCard: {
    backgroundColor: '#e6f7e9',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#096A2E',
  },
  messageText: {
    color: '#096A2E',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%',
  },
  locationLabel: {
    fontSize: 16,
    color: '#666',
  },
  locationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  updateButtonText: {
    color: '#5C4D7D',
    fontSize: 14,
  },
  actionButton: {
    width: '100%',
    marginVertical: 10,
    paddingVertical: 8,
    backgroundColor: '#5C4D7D',
    borderRadius: 30,
  },
});
