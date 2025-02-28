import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Checkbox, Text, Avatar, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';

// Constants
const BUTTON_STYLES = {
  dateTime: {
    width: 200,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(174,207,117,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  send: {
    width: 100,
    height: 52,
    backgroundColor: 'rgba(174,207,117,0.75)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sendText: {
    color: '#096A2E',
    marginRight: 3,
  },
};

const LAYOUT = {
  buttonRow: {
    position: 'absolute',
    top: 290,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 5,
    backgroundColor: 'white',
    zIndex: 1,
  },
  listAdjustment: {
    top: 350,
    height: 520,
  },
  bottomContainer: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  memberStyle: {
    paddingLeft: 50,
  },
  selectedItem: {
    backgroundColor: '#74C69D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
};

export default function PickFriend({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendsData, setFriendsData] = useState([]);
  const [error, setError] = useState(null);

  // Get current user from store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const idToken = currentUser?.idToken;

  // Fetch friend data
  useEffect(() => {
    const loadFriendData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user has friends
        if (
          !currentUser ||
          !currentUser.friendsList ||
          currentUser.friendsList.length === 0
        ) {
          console.log('No friends found in user data');
          setFriendsData([]);
          setLoading(false);
          return;
        }

        console.log(
          'Friends list from currentUser:',
          JSON.stringify(currentUser.friendsList, null, 2),
        );

        // Process the friends data - fetch details for each friend
        const processedFriends = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              // Fetch friend details from API
              const details = await fetchFriendDetails(
                idToken,
                friend.friendID,
              );

              // Get initials for avatar
              const initials = `${details.firstName.charAt(
                0,
              )}${details.lastName.charAt(0)}`.toUpperCase();

              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                initials: initials,
                // Add any other friend details here
              };
            } catch (error) {
              console.error(
                `Error processing friend ${friend.friendID}:`,
                error,
              );
              return {
                id: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                initials: '?',
              };
            }
          }),
        );

        setFriendsData(processedFriends);
      } catch (error) {
        console.error('Error loading friend data:', error);
        setError('Failed to load your friends. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadFriendData();
  }, [currentUser, idToken]);

  // Toggle friend selection
  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  // Render individual friend item
  const renderFriend = ({ item }) => (
    <TouchableOpacity onPress={() => toggleSelection(item.id)}>
      <View
        style={[
          styles.listItem,
          selectedFriends.includes(item.id) ? LAYOUT.selectedItem : {},
        ]}
      >
        {/* Avatar */}
        <View style={styles.listItemAvatar}>
          <Avatar.Text
            size={40}
            label={item.initials || '?'}
            style={{ backgroundColor: '#fff' }}
            labelStyle={{ color: '#000' }}
          />
        </View>

        {/* Name and Email */}
        <View style={styles.listItemContent}>
          <Text>{item.name}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>{item.email}</Text>
        </View>

        {/* Checkbox */}
        <View style={styles.listItemCheckbox}>
          <Checkbox
            status={selectedFriends.includes(item.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleSelection(item.id)}
            color="#096A2E"
            uncheckedColor="#096A2E"
            style={{ borderRadius: 0 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Schedule Meal"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color="#096A2E" />
          <Text style={{ marginTop: 20 }}>Loading friends...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Schedule Meal"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  // No friends state
  if (!friendsData || friendsData.length === 0) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Schedule Meal"
          profilePic={profilePic}
        />
        <Text style={styles.header}>SCHEDULE A MEAL</Text>
        <Text style={styles.subheader}>
          Select friends to schedule a meal with.
        </Text>

        <View style={LAYOUT.emptyContainer}>
          <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
            You don't have any friends yet. Add some friends first!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddFriendsScreen')}
            style={{ marginTop: 10 }}
          >
            Add Friends
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top navigation bar */}
      <TopNav
        navigation={navigation}
        title="Schedule Meal"
        profilePic={profilePic}
      />

      {/* Main header */}
      <Text style={styles.header}>SCHEDULE A MEAL</Text>

      {/* Subheader */}
      <Text style={styles.subheader}>
        Select friends to schedule a meal with.
      </Text>

      {/* Date/Time and Send button row */}
      <View style={LAYOUT.buttonRow}>
        {/* Date/Time button */}
        <TouchableOpacity
          style={BUTTON_STYLES.dateTime}
          onPress={() => console.log('Date/Time pressed')}
        >
          <Text>Date/Time</Text>
        </TouchableOpacity>

        {/* Send button */}
        <TouchableOpacity
          style={[
            BUTTON_STYLES.send,
            selectedFriends.length === 0 ? { opacity: 0.5 } : {},
          ]}
          onPress={() => {
            if (selectedFriends.length > 0) {
              console.log('Scheduling meal with:', selectedFriends);
              // Get names of selected friends for the message
              const selectedNames = friendsData
                .filter((friend) => selectedFriends.includes(friend.id))
                .map((friend) => friend.name);

              navigation.navigate('WhatNow', {
                message: `Meal scheduled with ${selectedNames.join(', ')}!`,
              });
            } else {
              console.log('Please select at least one friend');
            }
          }}
          disabled={selectedFriends.length === 0}
        >
          <Text style={BUTTON_STYLES.sendText}>Send</Text>
          <MaterialCommunityIcons name="send" size={24} color="#096A2E" />
        </TouchableOpacity>
      </View>

      {/* Friends list */}
      <View style={[styles.listContainer, LAYOUT.listAdjustment]}>
        <FlatList
          data={friendsData}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={LAYOUT.emptyContainer}>
              <Text>No friends available</Text>
            </View>
          }
        />
      </View>

      {/* Bottom button */}
      <View style={[styles.bottomContainer, LAYOUT.bottomContainer]}>
        <TouchableOpacity
          style={[
            styles.pingButton,
            selectedFriends.length === 0 ? { opacity: 0.5 } : {},
          ]}
          onPress={() => {
            if (selectedFriends.length > 0) {
              console.log('Scheduling immediate meal with:', selectedFriends);
              // Get names of selected friends for the message
              const selectedNames = friendsData
                .filter((friend) => selectedFriends.includes(friend.id))
                .map((friend) => friend.name);

              navigation.navigate('WhatNow', {
                message: `Meal scheduled now with ${selectedNames.join(', ')}!`,
              });
            } else {
              console.log('Please select at least one friend');
            }
          }}
          disabled={selectedFriends.length === 0}
        >
          <Text style={styles.pingButtonLabel}>Schedule Meal Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
