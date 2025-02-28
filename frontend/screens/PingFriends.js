import React, { useState, useEffect } from 'react';
import {
  View,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Button, List, Checkbox, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';

const localStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 5,
  },
  headerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    alignItems: 'center',
    marginBottom: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '400',
  },
  subheaderText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 5,
    backgroundColor: 'white',
    zIndex: 1,
    marginBottom: 10,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  sendButton: {
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
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  selectedItem: {
    backgroundColor: '#74C69D',
  },
  bottomContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#CBDBA7',
    alignItems: 'center',
  },
  pingButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#5C4D7D',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

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

        console.log(
          'Friends list:',
          JSON.stringify(currentUser.friendsList, null, 2),
        );

        const friendsWithDetails = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
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
              // if we can't get their details
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

        const friendsByLocation = {};
        friendsWithDetails.forEach((friend) => {
          if (!friendsByLocation[friend.location]) {
            friendsByLocation[friend.location] = [];
          }
          friendsByLocation[friend.location].push(friend);
        });

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

  const handleSendPing = () => {
    if (selectedFriends.length > 0) {
      console.log('Pinging friends:', selectedFriends);
      // Get names of selected friends for the message
      const selectedNames = selectedFriends.map((friendID) => {
        const friend = groupedFriends
          .flatMap((section) => section.data)
          .find((f) => f.friendID === friendID);
        return friend ? friend.name : 'Friend';
      });

      navigation.navigate('WhatNow', {
        message: `Ping sent to ${selectedNames.join(', ')}!`,
      });
    } else {
      console.log('Please select at least one friend');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  // If no friends available  :(
  if (!currentUser?.friendsList || currentUser.friendsList.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Ping Friends"
          profilePic={profilePic}
        />
        <View style={localStyles.contentContainer}>
          <View style={localStyles.headerContainer}>
            <Text style={localStyles.headerText}>PING FRIENDS</Text>
          </View>
          <Text style={localStyles.subheaderText}>
            Select friends to ping based on location.
          </Text>

          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Ping Friends"
        profilePic={profilePic}
      />

      <View style={localStyles.contentContainer}>
        <View style={localStyles.headerContainer}>
          <Text style={localStyles.headerText}>PING FRIENDS</Text>
        </View>

        <Text style={localStyles.subheaderText}>
          Select friends to ping based on location.
        </Text>

        <View style={localStyles.listContainer}>
          <SectionList
            sections={groupedFriends}
            keyExtractor={(item, index) => item.friendID || `friend-${index}`}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={localStyles.sectionHeader}>{title}</Text>
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
                  localStyles.listItem,
                  selectedFriends.includes(item.friendID)
                    ? localStyles.selectedItem
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
        </View>
      </View>

      <View style={localStyles.bottomContainer}>
        <TouchableOpacity
          style={[
            localStyles.pingButton,
            selectedFriends.length === 0 ? { opacity: 0.5 } : {},
          ]}
          onPress={handleSendPing}
          disabled={selectedFriends.length === 0}
        >
          <Text style={localStyles.pingButtonLabel}>Ping Selected Friends</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
