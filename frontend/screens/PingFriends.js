import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  SectionList,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Button, List, Checkbox, Text, Avatar } from 'react-native-paper';
import useStore from '../store';
import styles, { BOX_SHADOW } from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';
import { sendPing } from '../services/ping-api';

// Utility function to format time since location update
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

export default function PingFriends({ navigation, route }) {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );
  const userSquads = useStore((state) => state.squadSlice.squads);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);
  const idToken = currentUser?.idToken;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUserProfile();
      setShouldRefresh(true);
    });

    return unsubscribe;
  }, [navigation, refreshUserProfile]);

  useEffect(() => {
    if (currentUser?.userID && shouldRefresh) {
      loadData();
    }
  }, [currentUser, shouldRefresh]);

  // Add a function to fix all timestamps in the database
  const fixAllTimestamps = async () => {
    if (!currentUser?.idToken) return;

    try {
      const response = await fetch(
        'http://localhost:9090/api/fix-location-timestamps',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.idToken}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log('TIMESTAMP DEBUG - Fix result:', result);
        alert(`Fix applied! ${result.details?.usersFixed || 0} users updated.`);

        // Reload data
        await loadData();
      } else {
        console.error('Error fixing timestamps:', await response.text());
      }
    } catch (err) {
      console.error('Error calling fix endpoint:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (userSquads.length === 0) {
        const fetchedSquads = await getUserSquads(currentUser.userID);
        setSquads(fetchedSquads || []);
      } else {
        setSquads(userSquads);
      }

      if (!currentUser.friendsList || currentUser.friendsList.length === 0) {
        setGroupedFriends([{ title: 'No Location', data: [] }]);
      } else {
        const friendsWithDetails = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                idToken,
                friend.friendID,
              );

              // Debug logging
              console.log(
                'TIMESTAMP DEBUG - PingFriends - Friend details:',
                JSON.stringify(details, null, 2),
              );
              console.log(
                'TIMESTAMP DEBUG - PingFriends - locationUpdatedAt raw:',
                details.locationUpdatedAt,
              );
              console.log(
                'TIMESTAMP DEBUG - PingFriends - locationUpdatedAt type:',
                typeof details.locationUpdatedAt,
              );

              // Check if locationUpdatedAt exists
              let locationUpdatedAt = null;
              let isTimestampInferred = false;

              // Logging extra details to understand the exact data received
              console.log(
                'TIMESTAMP DEBUG - PingFriends - Full details JSON:',
                JSON.stringify(details),
              );
              console.log(
                'TIMESTAMP DEBUG - PingFriends - Object.keys(details):',
                Object.keys(details),
              );

              // Check all possible timestamp fields
              console.log(
                'TIMESTAMP DEBUG - PingFriends - ALL timestamp fields:',
                {
                  locationUpdatedAt: details.locationUpdatedAt,
                  updatedAt: details.updatedAt,
                  createdAt: details.createdAt,
                  hasLocationUpdatedAt:
                    'locationUpdatedAt' in details &&
                    details.locationUpdatedAt !== null,
                  hasUpdatedAt:
                    'updatedAt' in details && details.updatedAt !== null,
                  hasCreatedAt:
                    'createdAt' in details && details.createdAt !== null,
                },
              );

              // If locationUpdatedAt is missing but updatedAt exists, use updatedAt as fallback
              if (!details.locationUpdatedAt && details.updatedAt) {
                console.log(
                  'TIMESTAMP DEBUG - PingFriends - Using updatedAt as fallback:',
                  details.updatedAt,
                );
                details.locationUpdatedAt = details.updatedAt;
              }

              // Check if any usable timestamp property exists and has a value
              const hasLocationUpdatedAt =
                'locationUpdatedAt' in details &&
                details.locationUpdatedAt !== null &&
                details.locationUpdatedAt !== undefined;
              console.log(
                'TIMESTAMP DEBUG - PingFriends - hasLocationUpdatedAt:',
                hasLocationUpdatedAt,
              );

              if (hasLocationUpdatedAt) {
                try {
                  // Use the existing timestamp
                  locationUpdatedAt = new Date(details.locationUpdatedAt);
                  console.log(
                    'TIMESTAMP DEBUG - PingFriends - Parsed locationUpdatedAt:',
                    locationUpdatedAt,
                  );
                  console.log(
                    'TIMESTAMP DEBUG - PingFriends - locationUpdatedAt.toString():',
                    locationUpdatedAt.toString(),
                  );
                  console.log(
                    'TIMESTAMP DEBUG - PingFriends - locationUpdatedAt.getTime():',
                    locationUpdatedAt.getTime(),
                  );

                  // Make sure it's a valid date (not NaN)
                  const isValidDate = !isNaN(locationUpdatedAt.getTime());
                  console.log(
                    'TIMESTAMP DEBUG - PingFriends - isValidDate:',
                    isValidDate,
                  );

                  if (!isValidDate) {
                    console.error(
                      'TIMESTAMP DEBUG - PingFriends - Invalid date from locationUpdatedAt',
                    );
                    locationUpdatedAt = null;
                    isTimestampInferred = true;
                  } else {
                    console.log(
                      'TIMESTAMP DEBUG - PingFriends - Valid date from locationUpdatedAt:',
                      locationUpdatedAt,
                    );
                    isTimestampInferred = false;
                  }
                } catch (err) {
                  console.error(
                    'TIMESTAMP DEBUG - PingFriends - Error parsing date:',
                    err,
                  );
                  locationUpdatedAt = null;
                  isTimestampInferred = true;
                }
              } else {
                // No timestamp available
                console.log(
                  'TIMESTAMP DEBUG - PingFriends - No locationUpdatedAt timestamp available',
                );
                locationUpdatedAt = null;
                isTimestampInferred = true;
              }

              console.log(
                'TIMESTAMP DEBUG - Final locationUpdatedAt:',
                locationUpdatedAt,
              );
              console.log(
                'TIMESTAMP DEBUG - isTimestampInferred:',
                isTimestampInferred,
              );

              // Format the time since update
              const lastUpdated = locationUpdatedAt
                ? formatTimeSince(locationUpdatedAt)
                : 'Never';

              console.log('Formatted lastUpdated:', lastUpdated);

              // Check if location is expired (more than 2 hours old)
              let isLocationExpired = true;

              if (locationUpdatedAt) {
                const ageInMinutes =
                  (new Date() - locationUpdatedAt) / (1000 * 60);
                console.log(
                  `Location age: ${ageInMinutes.toFixed(2)} minutes (${(
                    ageInMinutes / 60
                  ).toFixed(2)} hours)`,
                );
                // Location expires after 90 minutes (1.5 hours)
                isLocationExpired = ageInMinutes >= 90;
              } else {
                // If we don't have a timestamp but have a location, mark as unknown age
                isLocationExpired =
                  !details.location ||
                  details.location === 'No Location' ||
                  details.location === 'ghost';
              }

              console.log('Is location expired:', isLocationExpired);

              return {
                friendID: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                location: details.location || 'No Location',
                locationAvailable: friend.locationAvailable || false,
                mongoId: details._id,
                initials: `${details.firstName.charAt(
                  0,
                )}${details.lastName.charAt(0)}`.toUpperCase(),
                profilePic: details.profilePic,
                locationUpdatedAt: locationUpdatedAt,
                lastUpdated: lastUpdated,
                isLocationExpired: isLocationExpired,
                isTimestampInferred: isTimestampInferred,
              };
            } catch (error) {
              return {
                friendID: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                location: 'No Location',
                locationAvailable: false,
                initials: '??',
                profilePic: null,
                lastUpdated: 'Never',
                isLocationExpired: true,
                isTimestampInferred: true,
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
      }

      setShouldRefresh(false);
    } catch (error) {
      setError('Failed to load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendID) => {
    setSelectedFriends((prev) =>
      prev.includes(friendID)
        ? prev.filter((id) => id !== friendID)
        : [...prev, friendID],
    );
  };

  const toggleSquadSelection = (squadId) => {
    setSelectedSquads((prev) => {
      if (prev.includes(squadId)) {
        return prev.filter((id) => id !== squadId);
      }
      return [...prev, squadId];
    });
  };

  const handleSendPing = async () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }

    try {
      setLoading(true);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const pingData = {
        sender: currentUser._id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        message: "Let's grab a meal!",
        expiresAt: expiresAt,
        recipients: selectedFriends,
        squads: selectedSquads,
      };

      await sendPing(idToken, pingData);

      const selectedNames = [];

      if (selectedFriends.length > 0) {
        const friendNames = selectedFriends.map((friendID) => {
          const friend = groupedFriends
            .flatMap((section) => section.data)
            .find((f) => f.friendID === friendID);
          return friend ? friend.name : 'Friend';
        });
        selectedNames.push(...friendNames);
      }

      if (selectedSquads.length > 0) {
        const squadNames = selectedSquads.map((squadId) => {
          const squad = squads.find((s) => s._id === squadId);
          return squad ? squad.squadName : 'Squad';
        });
        selectedNames.push(...squadNames);
      }

      const displayNames =
        selectedNames.length <= 3
          ? selectedNames.join(', ')
          : `${selectedNames.slice(0, 2).join(', ')} and ${
              selectedNames.length - 2
            } more`;

      navigation.navigate('WhatNow', {
        message: `Ping sent to ${displayNames}!`,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send ping: ' + (error.message || 'Please try again'),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }) => (
    <View style={{ overflow: 'visible' }}>
      <List.Item
        title={item.name}
        description={() => (
          <View style={{ overflow: 'visible' }}>
            <Text>{item.email}</Text>

            {item.location &&
            item.location !== 'No Location' &&
            item.location !== 'ghost' ? (
              item.locationUpdatedAt ? (
                !item.isLocationExpired ? (
                  <Text style={localStyles.locationTime}>
                    Last updated: {item.lastUpdated}
                  </Text>
                ) : (
                  <Text style={localStyles.expiredLocation}>
                    Location expired ({item.lastUpdated})
                  </Text>
                )
              ) : (
                <Text style={localStyles.unknownTime}>
                  Location available (unknown update time)
                </Text>
              )
            ) : (
              <Text style={localStyles.noLocation}>No location shared</Text>
            )}
          </View>
        )}
        left={() =>
          !item.profilePic ? (
            <Avatar.Text
              size={40}
              label={item.initials}
              style={localStyles.avatar}
            />
          ) : (
            <Avatar.Image
              size={40}
              source={{ uri: item.profilePic }}
              style={localStyles.avatar}
            />
          )
        }
        right={() => (
          <Checkbox
            status={
              selectedFriends.includes(item.friendID) ? 'checked' : 'unchecked'
            }
            onPress={() => toggleFriendSelection(item.friendID)}
          />
        )}
        onPress={() => toggleFriendSelection(item.friendID)}
        style={[
          localStyles.listItem,
          selectedFriends.includes(item.friendID)
            ? localStyles.selectedItem
            : {},
        ]}
      />
    </View>
  );

  const renderSquadItem = ({ item }) => (
    <View style={{ overflow: 'visible' }}>
      <List.Item
        title={item.squadName}
        description={`${item.members.length} members`}
        left={() => <List.Icon icon="account-group" />}
        right={() => (
          <Checkbox
            status={selectedSquads.includes(item._id) ? 'checked' : 'unchecked'}
            onPress={() => toggleSquadSelection(item._id)}
          />
        )}
        onPress={() => toggleSquadSelection(item._id)}
        style={[
          localStyles.listItem,
          selectedSquads.includes(item._id) ? localStyles.selectedItem : {},
        ]}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color="#096A2E" />
          <Text style={{ marginTop: 20 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav navigation={navigation} title="Ping Friends" />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text>
          <Button
            mode="contained"
            onPress={() => {
              setShouldRefresh(true);
            }}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (
    (!currentUser?.friendsList || currentUser.friendsList.length === 0) &&
    (!squads || squads.length === 0)
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav navigation={navigation} title="Ping Friends" />
        <View style={{ height: 50 }} />
        <View style={localStyles.contentContainer}>
          <Text style={localStyles.subheaderText}>
            Select friends or squads to ping.
          </Text>

          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              You don't have any friends or squads yet. Add some first!
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
      <TopNav navigation={navigation} title="Ping Friends" />
      <View style={{ height: 50 }} />

      <View style={localStyles.contentContainer}>
        <Text style={localStyles.subheaderText}>
          Select friends or squads to ping.
        </Text>

        <View style={localStyles.tabContainer}>
          <TouchableOpacity
            style={[
              localStyles.tab,
              localStyles.leftTab,
              activeTab === 'friends' && localStyles.activeTab,
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                localStyles.tabText,
                activeTab === 'friends' && localStyles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.tab,
              localStyles.rightTab,
              activeTab === 'squads' && localStyles.activeTab,
            ]}
            onPress={() => setActiveTab('squads')}
          >
            <Text
              style={[
                localStyles.tabText,
                activeTab === 'squads' && localStyles.activeTabText,
              ]}
            >
              Squads
            </Text>
          </TouchableOpacity>
        </View>

        <View style={localStyles.listContainer}>
          {activeTab === 'friends' ? (
            groupedFriends.length > 0 ? (
              <View style={{ overflow: 'visible', flex: 1 }}>
                <SectionList
                  contentContainerStyle={{ overflow: 'visible' }}
                  sections={groupedFriends}
                  keyExtractor={(item, index) =>
                    item.friendID || `friend-${index}`
                  }
                  renderSectionHeader={({ section: { title } }) => (
                    <Text style={localStyles.sectionHeader}>{title}</Text>
                  )}
                  renderItem={renderFriendItem}
                  ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text>No friends available</Text>
                    </View>
                  }
                />
              </View>
            ) : (
              <View style={localStyles.emptyContainer}>
                <Text style={localStyles.emptyText}>
                  You don't have any friends yet. Add some friends first!
                </Text>
              </View>
            )
          ) : (
            <View style={{ overflow: 'visible', flex: 1 }}>
              <FlatList
                contentContainerStyle={{ overflow: 'visible' }}
                data={squads}
                renderItem={renderSquadItem}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text>No squads available</Text>
                  </View>
                }
              />
            </View>
          )}
        </View>
      </View>

      <View style={localStyles.bottomContainer}>
        <Button
          mode="contained"
          disabled={selectedFriends.length === 0 && selectedSquads.length === 0}
          style={localStyles.pingButton}
          onPress={handleSendPing}
          labelStyle={{ fontSize: 16 }}
        >
          Ping Selected {activeTab === 'friends' ? 'Friends' : 'Squads'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 5,
    alignItems: 'center',
    marginBottom: 15,
    gap: 5,
  },
  subheaderText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: '12.5%',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8f8ff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  leftTab: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightTab: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  activeTab: {
    backgroundColor: '#e9e6ff',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#6750a4',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 5,
    backgroundColor: 'white',
    zIndex: 1,
  },
  listContainer: {
    flex: 1,
    width: '90%',
    overflow: 'visible',
  },
  sendButton: {
    width: 100,
    height: 52,
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
    backgroundColor: '#f8f8ff',
  },
  selectedItem: {
    backgroundColor: '#e9e6ff',
  },
  pingButton: {
    borderRadius: 15,
    padding: 5,
    ...BOX_SHADOW,
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
  avatar: {
    backgroundColor: '#CBDBA7',
  },
  locationTime: {
    fontSize: 12,
    color: '#096A2E',
    marginTop: 2,
  },
  expiredLocation: {
    fontSize: 12,
    color: '#dd6b55',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  unknownTime: {
    fontSize: 12,
    color: '#8e5ba1', // Purple shade
    marginTop: 2,
  },
});
