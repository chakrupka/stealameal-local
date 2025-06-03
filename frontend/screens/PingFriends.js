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

export default function PingFriends({ navigation }) {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [friendAvailability, setFriendAvailability] = useState({});
  const [squadAvailability, setSquadAvailability] = useState({});
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedFriendForSchedule, setSelectedFriendForSchedule] =
    useState(null);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);
  const idToken = currentUser?.idToken;

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never updated';

    try {
      const locationTime = new Date(dateString);
      const now = new Date();
      const diffMs = now - locationTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return 'Over a week ago';
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return 'Unknown';
    }
  };

  const loadInitialData = useCallback(async () => {
    if (!currentUser?.userID || !idToken) {
      setError('User not properly authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const squadPromise = getUserSquads(currentUser.userID).catch((err) => {
        console.error('Error loading squads:', err);
        return [];
      });

      let friendsPromise = Promise.resolve([]);
      if (currentUser.friendsList && currentUser.friendsList.length > 0) {
        friendsPromise = Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                idToken,
                friend.friendID,
              );

              console.log('Friend details for', friend.friendID, ':', {
                location: details.location,
                locationUpdatedAt: details.locationUpdatedAt,
              });

              return {
                friendID: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                location: details.location || 'No Location',
                locationUpdatedAt: details.locationUpdatedAt,
                locationAvailable: friend.locationAvailable || false,
                mongoId: details._id,
                initials: `${details.firstName.charAt(
                  0,
                )}${details.lastName.charAt(0)}`.toUpperCase(),
                profilePic: details.profilePic,
              };
            } catch (error) {
              console.error(`Error fetching friend ${friend.friendID}:`, error);
              return {
                friendID: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                location: 'No Location',
                locationUpdatedAt: null,
                locationAvailable: false,
                initials: '??',
              };
            }
          }),
        );
      }

      const [fetchedSquads, friendsWithDetails] = await Promise.all([
        squadPromise,
        friendsPromise,
      ]);

      setSquads(fetchedSquads || []);

      if (friendsWithDetails && friendsWithDetails.length > 0) {
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
      } else {
        setGroupedFriends([]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.userID, idToken, getUserSquads, currentUser?.friendsList]);

  const checkFriendsAvailability = useCallback(async () => {
    if (!idToken || groupedFriends.length === 0) return;

    try {
      const now = new Date();
      // Check availability for the next 30 minutes for more accurate "right now" status
      const startTime = new Date(now);
      const endTime = new Date(now.getTime() + 30 * 60 * 1000);

      const allFriends = groupedFriends.flatMap((section) => section.data);
      const friendUIDs = allFriends.map((f) => f.friendID);

      if (friendUIDs.length === 0) return;

      console.log('Checking availability for friends:', friendUIDs);

      const response = await checkAvailability(
        idToken,
        friendUIDs,
        now.toISOString(),
        startTime.toISOString(),
        endTime.toISOString(),
      );

      console.log('Availability response:', response);

      // Initialize all friends as available by default
      const availabilityMap = {};
      allFriends.forEach((friend) => {
        availabilityMap[friend.friendID] = true;
      });

      // Mark as unavailable if explicitly returned as false
      if (response?.results) {
        response.results.forEach((result) => {
          if (result.isAvailable === false) {
            availabilityMap[result.userID] = false;
            console.log(`${result.name || result.userID} is busy right now`);
          }
        });
      }

      setFriendAvailability(availabilityMap);
    } catch (error) {
      console.error('Error checking friend availability:', error);
      // On error, default everyone to available
      const allFriends = groupedFriends.flatMap((section) => section.data);
      const availabilityMap = {};
      allFriends.forEach((friend) => {
        availabilityMap[friend.friendID] = true;
      });
      setFriendAvailability(availabilityMap);
    }
  }, [idToken, groupedFriends]);

  const checkSquadsAvailability = useCallback(async () => {
    if (!idToken || squads.length === 0) return;

    try {
      const now = new Date();
      // Check availability for the next 30 minutes
      const startTime = new Date(now);
      const endTime = new Date(now.getTime() + 30 * 60 * 1000);

      const squadAvailabilityMap = {};

      for (const squad of squads) {
        if (squad.members && squad.members.length > 0) {
          try {
            const memberUIDs = squad.members.map(
              (member) => member.userID || member,
            );

            const response = await checkAvailability(
              idToken,
              memberUIDs,
              now.toISOString(),
              startTime.toISOString(),
              endTime.toISOString(),
            );

            // Count available members
            let availableCount = 0;
            const busyMembers = [];

            if (response?.results) {
              response.results.forEach((result) => {
                if (result.isAvailable !== false) {
                  availableCount++;
                } else {
                  busyMembers.push(result.name || 'Unknown');
                }
              });
            } else {
              availableCount = squad.members.length;
            }

            squadAvailabilityMap[squad._id] = {
              available: availableCount,
              total: squad.members.length,
              busyMembers: busyMembers,
            };
          } catch (error) {
            console.error(`Error checking squad ${squad.squadName}:`, error);
            squadAvailabilityMap[squad._id] = {
              available: squad.members.length,
              total: squad.members.length,
              busyMembers: [],
            };
          }
        } else {
          squadAvailabilityMap[squad._id] = {
            available: 0,
            total: 0,
            busyMembers: [],
          };
        }
      }

      setSquadAvailability(squadAvailabilityMap);
    } catch (error) {
      console.error('Error checking squad availability:', error);
      const squadAvailabilityMap = {};
      squads.forEach((squad) => {
        squadAvailabilityMap[squad._id] = {
          available: squad.members?.length || 0,
          total: squad.members?.length || 0,
          busyMembers: [],
        };
      });
      setSquadAvailability(squadAvailabilityMap);
    }
  }, [idToken, squads]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (loading) return;

    checkFriendsAvailability();
    checkSquadsAvailability();

    // Check availability every 2 minutes
    const interval = setInterval(() => {
      checkFriendsAvailability();
      checkSquadsAvailability();
    }, 120000);

    return () => clearInterval(interval);
  }, [loading, checkFriendsAvailability, checkSquadsAvailability]);

  const handleLongPressFriend = async (friend) => {
    try {
      console.log('Fetching schedule for friend:', friend.friendID);
      const friendSchedule = await getFriendAvailability(
        idToken,
        friend.friendID,
      );
      console.log('Friend schedule response:', friendSchedule);

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
    if (!selectedFriendForSchedule?.availability) {
      console.log('No availability data found');
      return null;
    }

    const { availability } = selectedFriendForSchedule;
    console.log(
      'Full availability object:',
      JSON.stringify(availability, null, 2),
    );

    // More robust safe array function with better debugging
    const safeArray = (arr, categoryName) => {
      console.log(`Processing ${categoryName}:`, arr);

      if (!arr) {
        console.log(`${categoryName} is null/undefined`);
        return [];
      }

      if (Array.isArray(arr)) {
        console.log(`${categoryName} is array with ${arr.length} items`);
        return arr;
      }

      // Handle case where it might be an object with array-like properties
      if (typeof arr === 'object') {
        if (arr.length !== undefined) {
          console.log(
            `${categoryName} is array-like object with length ${arr.length}`,
          );
          return Array.from(arr);
        }

        // If it's an object but not array-like, try to extract values
        const values = Object.values(arr);
        if (values.length > 0 && Array.isArray(values[0])) {
          console.log(`${categoryName} contains nested arrays`);
          return values.flat();
        }
      }

      console.log(`${categoryName} is not processable:`, typeof arr);
      return [];
    };

    // Process each category with debugging
    const classItems = safeArray(availability.classes, 'classes').map(
      (item) => ({
        ...item,
        category: 'classes',
      }),
    );

    const sportingItems = safeArray(availability.sporting, 'sporting').map(
      (item) => ({
        ...item,
        category: 'sporting',
      }),
    );

    const extraItems = safeArray(
      availability.extracurricular,
      'extracurricular',
    ).map((item) => ({
      ...item,
      category: 'extracurricular',
    }));

    const otherItems = safeArray(availability.other, 'other').map((item) => ({
      ...item,
      category: 'other',
    }));

    const allItems = [
      ...classItems,
      ...sportingItems,
      ...extraItems,
      ...otherItems,
    ];

    console.log('Processed items:', {
      classes: classItems.length,
      sporting: sportingItems.length,
      extracurricular: extraItems.length,
      other: otherItems.length,
      total: allItems.length,
    });

    const formatTime = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.log('Invalid date:', dateString);
          return '';
        }
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.error('Error formatting time:', error);
        return '';
      }
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

    // Create a weekly schedule grid
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayAbbreviations = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

    // Group items by day
    const scheduleByDay = {};
    daysOfWeek.forEach((day) => {
      scheduleByDay[day] = [];
    });

    allItems.forEach((item) => {
      console.log('Processing item:', item.name, 'Days:', item.days);

      if (item.days && Array.isArray(item.days)) {
        item.days.forEach((dayAbbr) => {
          const dayIndex = dayAbbreviations.indexOf(dayAbbr);
          if (dayIndex !== -1) {
            const fullDayName = daysOfWeek[dayIndex];
            scheduleByDay[fullDayName].push(item);
            console.log(`Added ${item.name} to ${fullDayName}`);
          } else {
            console.log(`Unknown day abbreviation: ${dayAbbr}`);
          }
        });
      } else {
        console.log(`Item ${item.name} has no valid days array:`, item.days);
      }
    });

    // Sort items within each day by start time
    Object.keys(scheduleByDay).forEach((day) => {
      scheduleByDay[day].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime) - new Date(b.startTime);
      });
    });

    console.log('Final schedule by day:', scheduleByDay);

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
                {selectedFriendForSchedule.name}'s Weekly Schedule
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
                {daysOfWeek.map((day, dayIndex) => {
                  const dayActivities = scheduleByDay[day] || [];

                  return (
                    <View key={day} style={localStyles.dayContainer}>
                      <Text style={localStyles.dayHeader}>
                        {day} ({dayActivities.length})
                      </Text>
                      {dayActivities.length === 0 ? (
                        <Text style={localStyles.noDayActivities}>Free</Text>
                      ) : (
                        dayActivities.map((item, itemIndex) => (
                          <View
                            key={`${day}-${itemIndex}`}
                            style={[
                              localStyles.condensedScheduleItem,
                              {
                                borderLeftColor: getCategoryColor(
                                  item.category,
                                ),
                              },
                            ]}
                          >
                            <View style={localStyles.scheduleItemRow}>
                              <Text style={localStyles.condensedItemName}>
                                {item.name || 'Unnamed Activity'}
                              </Text>
                              <Text style={localStyles.condensedItemTime}>
                                {item.startTime && item.endTime
                                  ? `${formatTime(
                                      item.startTime,
                                    )} - ${formatTime(item.endTime)}`
                                  : item.timeBlock || 'No time specified'}
                              </Text>
                            </View>
                            <Text style={localStyles.condensedItemCategory}>
                              {item.category?.charAt(0).toUpperCase() +
                                item.category?.slice(1) || 'Unknown'}
                            </Text>
                          </View>
                        ))
                      )}
                      {dayIndex < daysOfWeek.length - 1 && (
                        <View style={localStyles.dayDivider} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <Button
              mode="outlined"
              style={localStyles.closeModalButton}
              onPress={() => setScheduleModalVisible(false)}
              textColor="white"
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    );
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
      console.error('Error sending ping:', error);
      Alert.alert(
        'Error',
        'Failed to send ping: ' + (error.message || 'Please try again'),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }) => {
    const isAvailable = friendAvailability[item.friendID];
    const isBusy = isAvailable === false;
    const isSelected = selectedFriends.includes(item.friendID);
    const timeAgo = getTimeAgo(item.locationUpdatedAt);

    // Enhanced description with location update time
    const getDescription = () => {
      let description = item.email;
      if (item.location && item.location !== 'No Location') {
        description += ` • ${item.location}`;
      }
      if (item.locationUpdatedAt) {
        description += ` • ${timeAgo}`;
      }
      if (isBusy) {
        description += ' • Currently busy';
      }
      return description;
    };

    return (
      <TouchableOpacity
        onPress={() => toggleFriendSelection(item.friendID)}
        onLongPress={() => handleLongPressFriend(item)}
      >
        <List.Item
          title={item.name}
          description={getDescription()}
          left={(props) => (
            <View style={localStyles.avatarWrapper}>
              {!item.profilePic ? (
                <Avatar.Text
                  size={50}
                  label={item.initials}
                  style={localStyles.avatar}
                />
              ) : (
                <Avatar.Image
                  size={50}
                  source={{ uri: item.profilePic }}
                  style={localStyles.avatar}
                />
              )}
              {/* Status indicators */}
              <View style={localStyles.statusIndicators}>
                {isBusy && (
                  <View style={localStyles.busyIconContainer}>
                    <MaterialCommunityIcons
                      name="clock-alert"
                      size={12}
                      color="#fff"
                    />
                  </View>
                )}
              </View>
            </View>
          )}
          right={() => (
            <View style={localStyles.rightContainer}>
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleFriendSelection(item.friendID)}
                color="white"
              />
            </View>
          )}
          style={[
            localStyles.listItem,
            isBusy && localStyles.busyItem,
            isSelected && localStyles.selectedItem,
          ]}
          titleStyle={{
            color: isSelected ? '#fff' : isBusy ? '#d32f2f' : '#000',
          }}
          descriptionStyle={{
            color: isSelected ? '#fff' : isBusy ? '#d32f2f' : '#000',
            fontSize: 12,
            marginBottom: -10,
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderSquadItem = ({ item }) => {
    const availability = squadAvailability[item._id];
    const isSelected = selectedSquads.includes(item._id);

    const getAvailabilityText = () => {
      if (!availability) {
        return `${item.members?.length || 0} members`;
      }

      let text = `${availability.available}/${availability.total} available now`;

      if (availability.busyMembers && availability.busyMembers.length > 0) {
        const busyCount = availability.busyMembers.length;
        if (busyCount === 1) {
          text += ` • ${availability.busyMembers[0]} is busy`;
        } else if (busyCount <= 3) {
          text += ` • ${availability.busyMembers.join(', ')} are busy`;
        } else {
          text += ` • ${busyCount} members are busy`;
        }
      }

      return text;
    };

    return (
      <List.Item
        title={item.squadName}
        description={getAvailabilityText()}
        left={() => (
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color={
              isSelected
                ? '#fff'
                : availability && availability.available < availability.total
                ? '#f57c00'
                : '#666'
            }
            style={{ marginLeft: 16, marginRight: 8 }}
          />
        )}
        right={() => (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => toggleSquadSelection(item._id)}
            color="black"
          />
        )}
        onPress={() => toggleSquadSelection(item._id)}
        style={[localStyles.listItem, isSelected && localStyles.selectedItem]}
        titleStyle={{
          color: isSelected ? '#fff' : '#000',
        }}
        descriptionStyle={{
          color: isSelected
            ? '#fff'
            : availability && availability.available < availability.total
            ? '#f57c00'
            : '#666',
          fontSize: 12,
        }}
      />
    );
  };

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
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const hasNoData =
    (!currentUser?.friendsList || currentUser.friendsList.length === 0) &&
    (!squads || squads.length === 0);

  if (hasNoData) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav navigation={navigation} title="Ping Friends" />
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

      <View style={localStyles.contentContainer}>
        <Text style={localStyles.subheaderText}>
          Select friends or squads to ping. Long press to view schedules.
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
              <SectionList
                sections={groupedFriends}
                keyExtractor={(item, index) =>
                  item.friendID || `friend-${index}`
                }
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={localStyles.sectionHeader}>{title}</Text>
                )}
                renderItem={renderFriendItem}
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
      {renderScheduleModal()}
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
    gap: 5,
  },
  subheaderText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 15,
    width: '80%',
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
  listContainer: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    paddingHorizontal: 5,
    paddingBottom: 15,
    backgroundColor: '#e9e6ff',
  },
  selectedItem: {
    backgroundColor: '#6750a4',
  },
  busyItem: {
    backgroundColor: '#ffebee',
  },
  avatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 16,
    marginLeft: 8,
  },
  busyIconContainer: {
    position: 'absolute',
    top: -52,
    right: -12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatar: {
    backgroundColor: '#CBDBA7',
  },
  busyAvatar: {
    backgroundColor: '#ffcdd2',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingButton: {
    width: '90%',
    height: 50,
    marginTop: 15,
    backgroundColor: '#6750a4',
    borderRadius: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleModalContent: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4D7D',
    flex: 1,
    marginRight: 10,
  },
  divider: {
    marginBottom: 15,
    backgroundColor: '#E8F5D9',
  },
  scheduleScrollView: {
    maxHeight: 400,
    marginBottom: 15,
  },
  emptySchedule: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  dayContainer: {
    marginBottom: 15,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4D7D',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5D9',
  },
  noDayActivities: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  condensedScheduleItem: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
  },
  scheduleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  condensedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  condensedItemTime: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  condensedItemCategory: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  dayDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 10,
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: '#6750a4',
    borderRadius: 15,
  },
});
