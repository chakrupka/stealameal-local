import React, { useState, useEffect } from 'react';
import { View, SectionList, ActivityIndicator } from 'react-native';
import { Button, List, Checkbox, Text } from 'react-native-paper';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';

export default function PingFriends({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user and API-related functions from store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const idToken = currentUser?.idToken;

  useEffect(() => {
    // Fetch friends data when component mounts
    const fetchFriendsData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (
          !currentUser ||
          !currentUser.friendsList ||
          currentUser.friendsList.length === 0
        ) {
          console.log('No friends list available');
          setGroupedFriends([{ title: 'No Location', data: [] }]);
          setLoading(false);
          return;
        }

        // Log the friends list for debugging
        console.log(
          'Friends list:',
          JSON.stringify(currentUser.friendsList, null, 2),
        );

        // Fetch additional details for each friend
        const friendsWithDetails = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              // Fetch the friend's details from your API
              const details = await fetchFriendDetails(
                idToken,
                friend.friendID,
              );

              return {
                friendID: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                location: details.location || 'No Location',
                locationAvailable: friend.locationAvailable || false,
              };
            } catch (error) {
              console.error(
                `Error fetching details for friend ${friend.friendID}:`,
                error,
              );
              // Return a fallback object if we can't get the details
              return {
                friendID: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                location: 'No Location',
                locationAvailable: false,
              };
            }
          }),
        );

        // Group friends by location
        const friendsByLocation = {};
        friendsWithDetails.forEach((friend) => {
          if (!friendsByLocation[friend.location]) {
            friendsByLocation[friend.location] = [];
          }
          friendsByLocation[friend.location].push(friend);
        });

        // Convert to sections format
        const sections = Object.keys(friendsByLocation).map((location) => ({
          title: location,
          data: friendsByLocation[location],
        }));

        setGroupedFriends(sections);
      } catch (error) {
        console.error('Error fetching friends data:', error);
        setError('Failed to load your friends. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [currentUser, idToken]);

  const toggleSelection = (friendID) => {
    setSelectedFriends((prev) =>
      prev.includes(friendID)
        ? prev.filter((id) => id !== friendID)
        : [...prev, friendID],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Ping Friends"
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

  if (error) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Ping Friends"
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

  // If no friends are available
  if (!currentUser?.friendsList || currentUser.friendsList.length === 0) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Ping Friends"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            You don't have any friends yet.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddFriends')}
          >
            Add Friends
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Ping Friends"
        profilePic={profilePic}
      />

      <SectionList
        sections={groupedFriends}
        keyExtractor={(item, index) => item.friendID || `friend-${index}`}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.email}
            left={() => <List.Icon icon="account-circle" />}
            right={() => (
              <Checkbox
                status={
                  selectedFriends.includes(item.friendID)
                    ? 'checked'
                    : 'unchecked'
                }
                onPress={() => toggleSelection(item.friendID)}
              />
            )}
            onPress={() => toggleSelection(item.friendID)}
            style={[
              styles.listItem,
              selectedFriends.includes(item.friendID)
                ? { backgroundColor: '#74C69D' }
                : {},
            ]}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>No friends in this location</Text>
          </View>
        }
      />

      {selectedFriends.length > 0 && (
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => {
            console.log(`Pinging friends with IDs:`, selectedFriends);
            // Here you would implement your ping functionality
            // For example: sendPingToFriends(selectedFriends);

            // Show confirmation
            navigation.navigate('WhatNow', {
              message: `Ping sent to ${selectedFriends.length} friend${
                selectedFriends.length > 1 ? 's' : ''
              }!`,
            });
          }}
        >
          Ping {selectedFriends.length} Friend
          {selectedFriends.length > 1 ? 's' : ''}
        </Button>
      )}
    </View>
  );
}
