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
  Modal,
  ScrollView,
} from 'react-native';
import {
  Button,
  List,
  Checkbox,
  Text,
  Avatar,
  Card,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';
import { sendPing } from '../services/ping-api';
import {
  checkAvailability,
  getFriendAvailability,
} from '../services/availability-api';

export default function PingFriends({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [friendAvailability, setFriendAvailability] = useState({});
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedFriendForSchedule, setSelectedFriendForSchedule] =
    useState(null);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const userSquads = useStore((state) => state.squadSlice.squads);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);
  const getAllSquads = useStore((state) => state.squadSlice.getAllSquads);
  const idToken = currentUser?.idToken;

  const loadData = useCallback(async () => {
    if (dataLoaded || !currentUser?.userID) return;

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
        console.log('No friends list available');
        setGroupedFriends([{ title: 'No Location', data: [] }]);
      } else {
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
                mongoId: details._id,
                initials: `${details.firstName.charAt(
                  0,
                )}${details.lastName.charAt(0)}`.toUpperCase(),
              };
            } catch (error) {
              console.error(
                `Error fetching details for friend ${friend.friendID}:`,
                error,
              );
              return {
                friendID: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                location: 'No Location',
                locationAvailable: false,
                initials: '??',
              };
            }
          }),
        );

        await checkFriendsCurrentAvailability(friendsWithDetails);

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

      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, idToken, getUserSquads, userSquads, dataLoaded]);

  const checkFriendsCurrentAvailability = async (friends) => {
    if (!friends || friends.length === 0) return;

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const endHour = currentHour + 1;

      const startTime = new Date(now);
      startTime.setHours(currentHour, 0, 0, 0);

      const endTime = new Date(now);
      endTime.setHours(endHour, 0, 0, 0);

      const friendUIDs = friends.map((f) => f.friendID);
      const response = await checkAvailability(
        idToken,
        friendUIDs,
        now.toISOString(),
        startTime.toISOString(),
        endTime.toISOString(),
      );

      const availabilityMap = {};
      response.results.forEach((result) => {
        availabilityMap[result.userID] = result.isAvailable;
      });

      setFriendAvailability(availabilityMap);
    } catch (error) {
      console.error('Error checking friend availability:', error);
    }
  };

  const handleLongPressFriend = async (friend) => {
    try {
      setSelectedFriendForSchedule(friend);
      const friendSchedule = await getFriendAvailability(
        idToken,
        friend.friendID,
      );
      setSelectedFriendForSchedule({
        ...friend,
        availability: friendSchedule.availability,
      });
      setScheduleModalVisible(true);
    } catch (error) {
      console.error('Error fetching friend schedule:', error);
      Alert.alert('Error', "Could not load friend's schedule");
    }
  };

  const renderScheduleModal = () => {
    if (!selectedFriendForSchedule?.availability) return null;

    const { availability } = selectedFriendForSchedule;
    const allItems = [
      ...availability.classes.map((item) => ({ ...item, category: 'classes' })),
      ...availability.sporting.map((item) => ({
        ...item,
        category: 'sporting',
      })),
      ...availability.extracurricular.map((item) => ({
        ...item,
        category: 'extracurricular',
      })),
      ...availability.other.map((item) => ({ ...item, category: 'other' })),
    ];

    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const getCategoryColor = (category) => {
      switch (category) {
        case 'classes':
          return '#2196f3';
        case 'sporting':
          return '#4caf50';
        case 'extracurricular':
          return '#fbc02d';
        case 'other':
          return '#f44336';
        default:
          return '#666';
      }
    };

    return (
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.scheduleModalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>
                {selectedFriendForSchedule.name}'s Schedule
              </Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#5C4D7D"
                />
              </TouchableOpacity>
            </View>

            <Divider style={localStyles.divider} />

            {allItems.length === 0 ? (
              <View style={localStyles.emptySchedule}>
                <Text style={localStyles.emptyText}>
                  {selectedFriendForSchedule.name} hasn't shared their schedule
                  yet
                </Text>
              </View>
            ) : (
              <ScrollView style={localStyles.scheduleScrollView}>
                {allItems.map((item, index) => (
                  <Card
                    key={index}
                    style={[
                      localStyles.scheduleCard,
                      { borderLeftColor: getCategoryColor(item.category) },
                    ]}
                  >
                    <Card.Content>
                      <Text style={localStyles.scheduleItemName}>
                        {item.name}
                      </Text>
                      <Text style={localStyles.scheduleItemCategory}>
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </Text>

                      {item.days && item.days.length > 0 && (
                        <Text style={localStyles.scheduleItemDetails}>
                          Days: {item.days.join(', ')}
                        </Text>
                      )}

                      {item.startTime && item.endTime && (
                        <Text style={localStyles.scheduleItemDetails}>
                          Time: {formatTime(item.startTime)} -{' '}
                          {formatTime(item.endTime)}
                        </Text>
                      )}

                      {item.timeBlock && (
                        <Text style={localStyles.scheduleItemDetails}>
                          Block: {item.timeBlock}
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            )}

            <Button
              mode="contained"
              style={localStyles.closeModalButton}
              onPress={() => setScheduleModalVisible(false)}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      console.error('Error sending ping:', error);
      Alert.alert(
        'Error',
        'Failed to send ping: ' + (error.message || 'Please try again'),
      );
    } finally {
      setLoading(false);
    }
  };

  const getFriendItemStyle = (friend) => {
    const isSelected = selectedFriends.includes(friend.friendID);
    const isAvailable = friendAvailability[friend.friendID];

    if (isSelected) {
      return localStyles.selectedItem;
    } else if (isAvailable === false) {
      return localStyles.busyItem;
    }

    return localStyles.listItem;
  };

  const getFriendTextColor = (friend) => {
    const isSelected = selectedFriends.includes(friend.friendID);
    const isAvailable = friendAvailability[friend.friendID];

    if (isSelected) {
      return '#fff';
    } else if (isAvailable === false) {
      return '#999';
    }

    return '#000';
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => toggleFriendSelection(item.friendID)}
      onLongPress={() => handleLongPressFriend(item)}
    >
      <List.Item
        title={item.name}
        description={`${item.email}${
          friendAvailability[item.friendID] === false ? ' • Busy now' : ''
        }`}
        left={() => (
          <Avatar.Text
            size={40}
            label={item.initials}
            style={[
              localStyles.avatar,
              friendAvailability[item.friendID] === false &&
                localStyles.busyAvatar,
            ]}
          />
        )}
        right={() => (
          <View style={localStyles.rightContainer}>
            {friendAvailability[item.friendID] === false && (
              <MaterialCommunityIcons
                name="clock-alert"
                size={16}
                color="#f44336"
                style={{ marginRight: 8 }}
              />
            )}
            <Checkbox
              status={
                selectedFriends.includes(item.friendID)
                  ? 'checked'
                  : 'unchecked'
              }
              onPress={() => toggleFriendSelection(item.friendID)}
            />
          </View>
        )}
        style={getFriendItemStyle(item)}
        titleStyle={{ color: getFriendTextColor(item) }}
        descriptionStyle={{ color: getFriendTextColor(item) }}
      />
    </TouchableOpacity>
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
          <Text style={{ marginTop: 20 }}>Loading...</Text>
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

  if (
    (!currentUser?.friendsList || currentUser.friendsList.length === 0) &&
    (!squads || squads.length === 0)
  ) {
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
          Select friends or squads to ping. Long press to view schedules.
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
          ) : squads.length > 0 ? (
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
          ) : (
            <View style={localStyles.emptyContainer}>
              <Text style={localStyles.emptyText}>
                You don't have any squads yet. Create a squad first!
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateSquadScreen')}
                style={{ marginTop: 10 }}
              >
                Create Squad
              </Button>
            </View>
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

      {renderScheduleModal()}
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
  listContainer: {
    flex: 1,
    width: '100%',
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
  busyItem: {
    backgroundColor: '#ffebee',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  busyAvatar: {
    backgroundColor: '#ffcdd2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4D7D',
  },
  divider: {
    marginBottom: 15,
  },
  scheduleScrollView: {
    flex: 1,
    marginBottom: 15,
  },
  scheduleCard: {
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  scheduleItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scheduleItemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  scheduleItemDetails: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  emptySchedule: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  closeModalButton: {
    backgroundColor: '#5C4D7D',
  },
});
