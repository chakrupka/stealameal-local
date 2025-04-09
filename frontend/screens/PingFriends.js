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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';
import { sendPing } from '../services/ping-api';

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
    <List.Item
      title={item.name}
      description={item.email}
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
        selectedFriends.includes(item.friendID) ? localStyles.selectedItem : {},
      ]}
    />
  );

  const renderSquadItem = ({ item }) => (
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
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav navigation={navigation} title="Ping Friends" />
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
          <View style={localStyles.headerContainer}>
            <Text style={localStyles.headerText}>PING FRIENDS</Text>
          </View>
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
        <View style={localStyles.headerContainer}>
          <Text style={localStyles.headerText}>PING FRIENDS</Text>
        </View>

        <Text style={localStyles.subheaderText}>
          Select friends or squads to ping.
        </Text>

        <View style={localStyles.tabContainer}>
          <TouchableOpacity
            style={[
              localStyles.tab,
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
              <SectionList
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
            ) : (
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
            )
          ) : (
            <FlatList
              data={squads}
              renderItem={renderSquadItem}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text>No squads available</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      <View style={localStyles.bottomContainer}>
        <TouchableOpacity
          style={[
            localStyles.pingButton,
            selectedFriends.length === 0 && selectedSquads.length === 0
              ? { opacity: 0.5 }
              : {},
          ]}
          onPress={handleSendPing}
          disabled={selectedFriends.length === 0 && selectedSquads.length === 0}
        >
          <Text style={localStyles.pingButtonLabel}>
            Ping Selected {activeTab === 'friends' ? 'Friends' : 'Squads'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#E8F5D9',
    borderBottomWidth: 2,
    borderBottomColor: '#5C4D7D',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#5C4D7D',
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
    backgroundColor: '#A4C67D',
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
  avatar: {
    backgroundColor: '#CBDBA7',
  },
});
