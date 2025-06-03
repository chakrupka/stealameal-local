import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  TextInput,
  RadioButton,
  Checkbox,
  Divider,
  Switch,
  Card,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles, { BOX_SHADOW } from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';
import {
  checkAvailability,
  getFriendAvailability,
} from '../services/availability-api';

const LOCATION_OPTIONS = ['Foco', 'Collis', 'Novack', 'Fern', 'Hop'];

const getMealType = (hours) => {
  if (hours >= 5 && hours < 11) return 'breakfast';
  if (hours >= 11 && hours < 16) return 'lunch';
  return 'dinner';
};

const formatTimeForApi = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();

  let roundedMinutes = Math.round(minutes / 15) * 15;

  if (roundedMinutes === 60) {
    roundedMinutes = 0;
    hours = (hours + 1) % 24;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = roundedMinutes.toString().padStart(2, '0');
  const timeString = `${formattedHours}:${formattedMinutes}`;

  const generateValidTimes = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 15, 30, 45]) {
        times.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        );
      }
    }
    return times;
  };

  const allPossibleTimes = generateValidTimes();

  if (!allPossibleTimes.includes(timeString)) {
    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const selectedTimeInMinutes = timeToMinutes(timeString);

    let closestTime = allPossibleTimes[0];
    let minDifference = Math.abs(
      timeToMinutes(closestTime) - selectedTimeInMinutes,
    );

    for (const validTime of allPossibleTimes) {
      const difference = Math.abs(
        timeToMinutes(validTime) - selectedTimeInMinutes,
      );
      if (difference < minDifference) {
        minDifference = difference;
        closestTime = validTime;
      }
    }

    return closestTime;
  }

  return timeString;
};

const ScheduleMeal = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [isOpenToJoin, setIsOpenToJoin] = useState(false);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [friendAvailability, setFriendAvailability] = useState({});
  const [squadAvailability, setSquadAvailability] = useState({});
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedFriendForSchedule, setSelectedFriendForSchedule] =
    useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [mealName, setMealName] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // New state for meal duration and end time
  const [mealEndTime, setMealEndTime] = useState(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 1); // Default to 1 hour after start
    return endTime;
  });
  const [tempEndTime, setTempEndTime] = useState(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 1);
    return endTime;
  });
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const currentUser = useStore((state) => state.userSlice?.currentUser);
  const userSquads = useStore((state) => state.squadSlice?.squads || []);
  const getUserSquads = useStore((state) => state.squadSlice?.getUserSquads);
  const createMeal = useStore((state) => state.mealSlice?.createMeal);

  // Helper function to validate time order
  const validateTimeOrder = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    return startTime < endTime;
  };

  // Helper function to show time validation warning
  const showTimeValidationWarning = (callback) => {
    Alert.alert(
      'Invalid Time Range',
      'The end time cannot be before the start time. The end time will be automatically adjusted to be 1 hour after the start time.',
      [
        {
          text: 'OK',
          onPress: callback,
        },
      ],
    );
  };

  useEffect(() => {
    const timeOfDay = getMealType(selectedTime.getHours());
    const defaultName = `${timeOfDay.charAt(0).toUpperCase()}${timeOfDay.slice(
      1,
    )} at ${location}`;
    setMealName(defaultName);
  }, [selectedTime, location]);

  useEffect(() => {
    // Ensure end time is always after start time
    if (selectedTime >= mealEndTime) {
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 1);
      setMealEndTime(newEndTime);
      setTempEndTime(newEndTime);
    }
  }, [selectedTime, mealEndTime]);

  const checkAllFriendsAvailability = useCallback(
    async (date, startTime, endTime) => {
      if (!friends || friends.length === 0 || !currentUser?.idToken) {
        return;
      }

      try {
        const mealDateTime = new Date(date);
        mealDateTime.setHours(
          startTime.getHours(),
          startTime.getMinutes(),
          0,
          0,
        );

        const mealEndDateTime = new Date(date);
        mealEndDateTime.setHours(
          endTime.getHours(),
          endTime.getMinutes(),
          0,
          0,
        );

        const friendUIDs = friends.map((friend) => friend.id);

        const response = await checkAvailability(
          currentUser.idToken,
          friendUIDs,
          mealDateTime.toISOString(),
          mealDateTime.toISOString(),
          mealEndDateTime.toISOString(),
        );

        const availabilityMap = {};
        friends.forEach((friend) => {
          availabilityMap[friend.id] = true;
        });

        if (response?.results) {
          response.results.forEach((result) => {
            if (result.isAvailable === false) {
              availabilityMap[result.userID] = false;
            }
          });
        }

        setFriendAvailability(availabilityMap);
      } catch (error) {
        console.error('Error checking friends availability:', error);
        const fallbackAvailabilityMap = {};
        friends.forEach((friend) => {
          fallbackAvailabilityMap[friend.id] = true;
        });
        setFriendAvailability(fallbackAvailabilityMap);
      }
    },
    [friends, currentUser?.idToken],
  );

  const checkSquadsAvailability = useCallback(
    async (date, startTime, endTime) => {
      if (!squads || squads.length === 0 || !currentUser?.idToken) {
        return;
      }

      try {
        const mealDateTime = new Date(date);
        mealDateTime.setHours(
          startTime.getHours(),
          startTime.getMinutes(),
          0,
          0,
        );

        const mealEndDateTime = new Date(date);
        mealEndDateTime.setHours(
          endTime.getHours(),
          endTime.getMinutes(),
          0,
          0,
        );

        const squadAvailabilityMap = {};

        for (const squad of squads) {
          if (squad.members && squad.members.length > 0) {
            try {
              const memberUIDs = squad.members;

              const response = await checkAvailability(
                currentUser.idToken,
                memberUIDs,
                mealDateTime.toISOString(),
                mealDateTime.toISOString(),
                mealEndDateTime.toISOString(),
              );

              let availableCount = 0;
              let totalMembers = memberUIDs.length;
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
                availableCount = totalMembers;
              }

              squadAvailabilityMap[squad._id] = {
                available: availableCount,
                total: totalMembers,
                busyMembers: busyMembers,
              };
            } catch (error) {
              console.error(
                `Error checking squad ${squad._id} availability:`,
                error,
              );
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
        console.error('Error checking squads availability:', error);
        const fallbackSquadAvailabilityMap = {};
        squads.forEach((squad) => {
          fallbackSquadAvailabilityMap[squad._id] = {
            available: squad.members?.length || 0,
            total: squad.members?.length || 0,
            busyMembers: [],
          };
        });
        setSquadAvailability(fallbackSquadAvailabilityMap);
      }
    },
    [squads, currentUser?.idToken],
  );

  const loadData = useCallback(async () => {
    if (dataLoaded || !currentUser?.userID) return;

    setLoading(true);
    try {
      if (userSquads.length === 0 && getUserSquads) {
        const fetchedSquads = await getUserSquads(currentUser.userID);
        setSquads(fetchedSquads || []);
      } else {
        setSquads(userSquads);
      }

      if (currentUser?.friendsList && currentUser.friendsList.length > 0) {
        const friendsData = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                currentUser.idToken,
                friend.friendID,
              );

              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`,
                email: details.email,
                type: 'friend',
                mongoId: details._id,
                initials: `${details.firstName.charAt(
                  0,
                )}${details.lastName.charAt(0)}`.toUpperCase(),
                profilePic: details.profilePic,
              };
            } catch (error) {
              console.error('Error fetching friend details:', error);
              return {
                id: friend.friendID,
                name: 'Unknown Friend',
                email: 'Unknown',
                type: 'friend',
                initials: '??',
              };
            }
          }),
        );
        setFriends(friendsData);
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load friends and squads');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getUserSquads, userSquads, dataLoaded]);

  const handleLongPressFriend = async (friend) => {
    try {
      const friendSchedule = await getFriendAvailability(
        currentUser.idToken,
        friend.id,
      );

      setSelectedFriendForSchedule({
        ...friend,
        availability: friendSchedule.availability,
      });
      setScheduleModalVisible(true);
    } catch (error) {
      console.error('Error loading friend schedule:', error);
      Alert.alert('Error', "Could not load friend's schedule");
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedDate && selectedTime && mealEndTime && currentUser?.idToken) {
      const timeoutId = setTimeout(() => {
        if (friends.length > 0) {
          checkAllFriendsAvailability(selectedDate, selectedTime, mealEndTime);
        }

        if (squads.length > 0) {
          checkSquadsAvailability(selectedDate, selectedTime, mealEndTime);
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [
    friends,
    squads,
    selectedDate,
    selectedTime,
    mealEndTime,
    currentUser?.idToken,
    checkAllFriendsAvailability,
    checkSquadsAvailability,
  ]);

  const renderScheduleModal = () => {
    if (!selectedFriendForSchedule?.availability) {
      return null;
    }

    const { availability } = selectedFriendForSchedule;

    const safeArray = (arr) => {
      if (!arr) return [];
      if (Array.isArray(arr)) return arr;
      if (typeof arr === 'object') {
        if (arr.length !== undefined) return Array.from(arr);
        const values = Object.values(arr);
        if (values.length > 0 && Array.isArray(values[0])) return values.flat();
      }
      return [];
    };

    const classItems = safeArray(availability.classes).map((item) => ({
      ...item,
      category: 'classes',
    }));

    const sportingItems = safeArray(availability.sporting).map((item) => ({
      ...item,
      category: 'sporting',
    }));

    const extraItems = safeArray(availability.extracurricular).map((item) => ({
      ...item,
      category: 'extracurricular',
    }));

    const otherItems = safeArray(availability.other).map((item) => ({
      ...item,
      category: 'other',
    }));

    const allItems = [
      ...classItems,
      ...sportingItems,
      ...extraItems,
      ...otherItems,
    ];

    const formatTime = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
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

    const mealDate = selectedDate;

    const weekStart = new Date(mealDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const daysOfWeek = [];
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      daysOfWeek.push({
        name: dayNames[i],
        date: day,
        abbreviation: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][i],
      });
    }

    const isItemActiveOnDate = (item, checkDate, dayAbbr) => {
      if (item.occurrenceType === 'specific') {
        if (!item.specificDate) return false;
        const specificDate = new Date(item.specificDate);
        return (
          specificDate.getFullYear() === checkDate.getFullYear() &&
          specificDate.getMonth() === checkDate.getMonth() &&
          specificDate.getDate() === checkDate.getDate()
        );
      }

      if (!item.days || !item.days.includes(dayAbbr)) return false;

      if (item.startDate && checkDate < new Date(item.startDate)) return false;
      if (item.endDate && checkDate > new Date(item.endDate)) return false;

      return true;
    };

    const scheduleByDay = {};
    daysOfWeek.forEach((dayInfo) => {
      scheduleByDay[dayInfo.name] = [];
    });

    allItems.forEach((item) => {
      daysOfWeek.forEach((dayInfo) => {
        if (isItemActiveOnDate(item, dayInfo.date, dayInfo.abbreviation)) {
          scheduleByDay[dayInfo.name].push(item);
        }
      });
    });

    Object.keys(scheduleByDay).forEach((day) => {
      scheduleByDay[day].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime) - new Date(b.startTime);
      });
    });

    const formatWeekRange = () => {
      const startDate = daysOfWeek[0].date;
      const endDate = daysOfWeek[6].date;
      const startMonth = startDate.toLocaleDateString('en-US', {
        month: 'short',
      });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

      if (startMonth === endMonth) {
        return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else {
        return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
      }
    };

    const dayComponents = daysOfWeek.map((dayInfo, dayIndex) => {
      const dayActivities = scheduleByDay[dayInfo.name] || [];
      const isSelectedMealDay =
        dayInfo.date.toDateString() === mealDate.toDateString();

      const monthAbbr = dayInfo.date.toLocaleDateString('en-US', {
        month: 'short',
      });
      const dayNumber = dayInfo.date.getDate();

      return (
        <View key={dayInfo.name} style={localStyles.dayContainer}>
          <Text
            style={[
              localStyles.dayHeader,
              isSelectedMealDay && localStyles.selectedMealDay,
            ]}
          >
            {dayInfo.name} {monthAbbr} {dayNumber}
            {isSelectedMealDay && ' (Meal Day)'}
          </Text>
          {dayActivities.length === 0 ? (
            <Text style={localStyles.noDayActivities}>Free</Text>
          ) : (
            dayActivities.map((item, itemIndex) => (
              <View
                key={`${dayInfo.name}-${itemIndex}`}
                style={[
                  localStyles.condensedScheduleItem,
                  {
                    borderLeftColor: getCategoryColor(item.category),
                  },
                ]}
              >
                <View style={localStyles.scheduleItemRow}>
                  <Text style={localStyles.condensedItemName}>
                    {item.name || 'Unnamed Activity'}
                  </Text>
                  <Text style={localStyles.condensedItemTime}>
                    {item.startTime && item.endTime
                      ? `${formatTime(item.startTime)} - ${formatTime(
                          item.endTime,
                        )}`
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
    });

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

            <Text style={localStyles.weekRangeText}>
              Week of {formatWeekRange()}
            </Text>

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
                {dayComponents}
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

  const toggleFriendSelection = (id, type, mongoId) => {
    setSelectedFriends((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev.filter((item) => item.id !== id);
      }
      return [...prev, { id, type, mongoId }];
    });
  };

  const toggleSquadSelection = (squadId) => {
    setSelectedSquads((prev) => {
      if (prev.includes(squadId)) {
        return prev.filter((id) => id !== squadId);
      }
      return [...prev, squadId];
    });
  };

  const getFriendItemStyle = (friend) => {
    const isSelected = selectedFriends.some((item) => item.id === friend.id);
    const isAvailable = friendAvailability[friend.id];

    if (isSelected) {
      return [localStyles.friendItem, localStyles.selectedItem];
    } else if (isAvailable === false) {
      return [localStyles.friendItem, localStyles.busyItem];
    } else if (isAvailable === true) {
      return [localStyles.friendItem, localStyles.availableItem];
    }

    return [localStyles.friendItem, localStyles.unknownItem];
  };

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.some(
      (selected) => selected.id === item.id,
    );
    const isAvailable = friendAvailability[item.id];

    return (
      <TouchableOpacity
        style={getFriendItemStyle(item)}
        onPress={() => toggleFriendSelection(item.id, item.type, item.mongoId)}
        onLongPress={() => handleLongPressFriend(item)}
      >
        <View style={localStyles.friendItemContent}>
          <View style={localStyles.avatarContainer}>
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
            {isAvailable === false && (
              <View style={localStyles.busyIconContainer}>
                <MaterialCommunityIcons
                  name="clock-alert"
                  size={14}
                  color="#fff"
                />
              </View>
            )}
            {isAvailable === true && (
              <View style={localStyles.availableIconContainer}>
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              </View>
            )}
          </View>
          <View style={localStyles.friendInfo}>
            <Text
              style={[
                localStyles.friendName,
                isSelected && localStyles.selectedText,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                localStyles.friendEmail,
                isSelected && localStyles.selectedText,
              ]}
            >
              {item.email}
              {isAvailable === false && ' • Busy at this time'}
              {isAvailable === true && ' • Available'}
              {isAvailable === null && ' • Checking...'}
            </Text>
          </View>
          <View style={localStyles.checkboxContainer}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() =>
                toggleFriendSelection(item.id, item.type, item.mongoId)
              }
              color="#fff"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSquadItem = ({ item }) => {
    const availability = squadAvailability[item._id];
    const availableText = availability
      ? `${availability.available}/${availability.total} available now`
      : `${item.members?.length || 0} members`;

    const getBusyMembersText = (busyMembers) => {
      if (!busyMembers || busyMembers.length === 0) return '';

      if (busyMembers.length === 1) {
        return `${busyMembers[0]} busy at this time`;
      } else if (busyMembers.length === 2) {
        return `${busyMembers[0]} and ${busyMembers[1]} busy at this time`;
      } else if (busyMembers.length === 3) {
        return `${busyMembers[0]}, ${busyMembers[1]}, and ${busyMembers[2]} busy at this time`;
      } else {
        const remaining = busyMembers.length - 3;
        return `${busyMembers[0]}, ${busyMembers[1]}, ${busyMembers[2]}, and ${remaining} more busy at this time`;
      }
    };

    return (
      <TouchableOpacity
        style={[
          localStyles.squadItem,
          selectedSquads.includes(item._id) && localStyles.selectedItem,
        ]}
        onPress={() => toggleSquadSelection(item._id)}
      >
        <View style={localStyles.squadHeader}>
          <Text style={localStyles.squadName}>{item.squadName}</Text>
          <Checkbox
            status={selectedSquads.includes(item._id) ? 'checked' : 'unchecked'}
            onPress={() => toggleSquadSelection(item._id)}
            color="#fff"
          />
        </View>
        <Text
          style={[
            localStyles.squadMembersCount,
            availability &&
              availability.available < availability.total &&
              localStyles.partiallyBusyText,
          ]}
        >
          {availableText}
        </Text>
        {availability &&
          availability.busyMembers &&
          availability.busyMembers.length > 0 && (
            <Text style={[localStyles.busyMembersNote]}>
              {getBusyMembersText(availability.busyMembers)}
            </Text>
          )}
      </TouchableOpacity>
    );
  };

  const handleDateChange = (event, date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    if (time) {
      setTempTime(time);
    }
  };

  const handleEndTimeChange = (event, time) => {
    if (time) {
      setTempEndTime(time);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const showMealDetails = () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }
    setShowDetailsModal(true);
  };

  const scheduleMeal = async () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }

    if (!mealName) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const unavailableFriends = selectedFriends.filter(
      (item) => friendAvailability[item.id] === false,
    );

    if (unavailableFriends.length > 0) {
      const friendNames = unavailableFriends.map((item) => {
        const friend = friends.find((f) => f.id === item.id);
        return friend ? friend.name : 'Unknown';
      });

      Alert.alert(
        'Some friends are busy',
        `${friendNames.join(', ')} ${
          friendNames.length === 1 ? 'is' : 'are'
        } busy at this time. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithMealScheduling() },
        ],
      );
      return;
    }

    proceedWithMealScheduling();
  };

  const proceedWithMealScheduling = async () => {
    try {
      setLoading(true);

      const participants = selectedFriends.map((item) => ({
        userID: item.mongoId,
        status: 'invited',
      }));

      const date = new Date(selectedDate);
      date.setHours(selectedTime.getHours());
      date.setMinutes(selectedTime.getMinutes());

      const mealType = getMealType(selectedTime.getHours());
      const timeString = formatTimeForApi(selectedTime);

      const mealData = {
        mealName: mealName,
        host: currentUser._id,
        date: date,
        time: timeString,
        location: location,
        notes: notes,
        participants: participants,
        squadIds: selectedSquads,
        mealType: mealType,
        isOpenToJoin: isOpenToJoin,
      };

      console.log(
        'Scheduling meal with data:',
        JSON.stringify(mealData, null, 2),
      );

      const result = await createMeal(mealData);
      console.log('Meal created:', result);

      setShowDetailsModal(false);
      setSelectedFriends([]);
      setSelectedSquads([]);
      setLocation(LOCATION_OPTIONS[0]);
      setNotes('');

      Alert.alert('Success', `Meal "${mealName}" scheduled successfully`, [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('ViewMeals', {
              profilePic,
              reloadMeals: true,
            }),
        },
      ]);
    } catch (error) {
      console.error('Error scheduling meal:', error);
      Alert.alert(
        'Error',
        'Failed to schedule meal: ' + (error.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const scheduleNow = () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);

    setSelectedDate(now);
    setSelectedTime(now);
    setMealEndTime(endTime);
    setShowDetailsModal(true);
  };

  const renderLocationOption = useCallback(
    (locationName) => (
      <TouchableOpacity
        key={locationName}
        style={localStyles.locationOption}
        onPress={() => {
          setLocation(locationName);
          const timeOfDay = getMealType(selectedTime.getHours());
          const defaultName = `${timeOfDay
            .charAt(0)
            .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
          setMealName(defaultName);
        }}
      >
        <RadioButton
          value={locationName}
          status={location === locationName ? 'checked' : 'unchecked'}
          onPress={() => {
            setLocation(locationName);
            const timeOfDay = getMealType(selectedTime.getHours());
            const defaultName = `${timeOfDay
              .charAt(0)
              .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
            setMealName(defaultName);
          }}
          color="#5C4D7D"
        />
        <Text style={localStyles.locationOptionText}>{locationName}</Text>
      </TouchableOpacity>
    ),
    [location, selectedTime],
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNav navigation={navigation} title="Schedule Meal" />
      <View style={localStyles.contentContainer}>
        <Text style={localStyles.subheaderText}>
          Select friends or squads to schedule a meal with. Long press to view
          schedules.
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
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              style={localStyles.friendsList}
              contentContainerStyle={localStyles.friendsListContent}
              ListEmptyComponent={
                <Text style={localStyles.emptyText}>
                  No friends found. Add friends to schedule meals with them.
                </Text>
              }
            />
          ) : (
            <FlatList
              data={squads}
              renderItem={renderSquadItem}
              keyExtractor={(item) => item._id}
              style={localStyles.friendsList}
              contentContainerStyle={localStyles.friendsListContent}
              ListEmptyComponent={
                <Text style={localStyles.emptyText}>
                  No squads found. Create a squad to schedule group meals.
                </Text>
              }
            />
          )}
        </View>

        <View style={localStyles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              localStyles.dateTimeButton,
              selectedFriends.length === 0 && selectedSquads.length === 0
                ? localStyles.dtbInactive
                : localStyles.dtbActive,
            ]}
            onPress={showMealDetails}
          >
            <Text style={localStyles.dateTimeText}>Schedule Meal</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              style={localStyles.arrowRight}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meal details modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Schedule Meal</Text>

            <ScrollView style={localStyles.modalScroll}>
              <Text style={localStyles.modalLabel}>Meal Name:</Text>
              <TextInput
                style={localStyles.textInput}
                placeholder="Give your meal a name"
                value={mealName}
                onChangeText={setMealName}
              />

              <Text style={localStyles.modalLabel}>Date:</Text>
              <TouchableOpacity
                style={localStyles.inputField}
                onPress={() => {
                  setTempDate(new Date(selectedDate));
                  setShowDatePicker(true);
                }}
              >
                <Text>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
              <View style={localStyles.openToJoinSection}>
                <View style={localStyles.openToJoinHeader}>
                  <Text style={localStyles.modalLabel}>Open to Join:</Text>
                  <Switch
                    value={isOpenToJoin}
                    onValueChange={setIsOpenToJoin}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isOpenToJoin ? '#6750a4' : '#f4f3f4'}
                    style={{ marginBottom: 5 }}
                  />
                </View>
                <Text style={localStyles.openToJoinDescription}>
                  When enabled, your friends can see and join this meal from the
                  "Steal a Meal" page
                </Text>
              </View>

              {Platform.OS === 'ios' && showDatePicker && (
                <View style={localStyles.pickerContainer}>
                  <View style={localStyles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={localStyles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.pickerTitle}>Select Date</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDate(tempDate);
                        setShowDatePicker(false);
                        // Trigger availability check
                        setTimeout(() => {
                          if (friends.length > 0) {
                            checkAllFriendsAvailability(
                              tempDate,
                              selectedTime,
                              mealEndTime,
                            );
                          }
                          if (squads.length > 0) {
                            checkSquadsAvailability(
                              tempDate,
                              selectedTime,
                              mealEndTime,
                            );
                          }
                        }, 100);
                      }}
                    >
                      <Text style={localStyles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    style={localStyles.picker}
                  />
                </View>
              )}

              <Text style={localStyles.modalLabel}>Start Time:</Text>
              <TouchableOpacity
                style={localStyles.inputField}
                onPress={() => {
                  setTempTime(new Date(selectedTime));
                  setShowTimePicker(true);
                }}
              >
                <Text>{formatTime(selectedTime)}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showTimePicker && (
                <View style={localStyles.pickerContainer}>
                  <View style={localStyles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={localStyles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.pickerTitle}>
                      Select Start Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Validate time order and auto-adjust end time if needed
                        let newEndTime = mealEndTime;
                        if (tempTime >= mealEndTime) {
                          newEndTime = new Date(tempTime);
                          newEndTime.setHours(newEndTime.getHours() + 1);
                          setMealEndTime(newEndTime);
                          setTempEndTime(newEndTime);

                          showTimeValidationWarning(() => {
                            console.log(
                              'End time automatically adjusted to maintain valid time range',
                            );
                          });
                        }

                        setSelectedTime(tempTime);
                        const timeOfDay = getMealType(tempTime.getHours());
                        const defaultName = `${timeOfDay
                          .charAt(0)
                          .toUpperCase()}${timeOfDay.slice(1)} at ${location}`;
                        setMealName(defaultName);
                        setShowTimePicker(false);

                        // Trigger availability check
                        setTimeout(() => {
                          if (friends.length > 0) {
                            checkAllFriendsAvailability(
                              selectedDate,
                              tempTime,
                              newEndTime,
                            );
                          }
                          if (squads.length > 0) {
                            checkSquadsAvailability(
                              selectedDate,
                              tempTime,
                              newEndTime,
                            );
                          }
                        }, 100);
                      }}
                    >
                      <Text style={localStyles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={localStyles.picker}
                  />
                </View>
              )}

              <Text style={localStyles.modalLabel}>End Time:</Text>
              <TouchableOpacity
                style={localStyles.inputField}
                onPress={() => {
                  setTempEndTime(new Date(mealEndTime));
                  setShowEndTimePicker(true);
                }}
              >
                <Text>{formatTime(mealEndTime)}</Text>
              </TouchableOpacity>

              {/* Show warning if times are invalid */}
              {!validateTimeOrder(selectedTime, mealEndTime) && (
                <Text style={localStyles.timeWarning}>
                  ⚠️ End time should be after start time
                </Text>
              )}

              {Platform.OS === 'ios' && showEndTimePicker && (
                <View style={localStyles.pickerContainer}>
                  <View style={localStyles.pickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={localStyles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.pickerTitle}>Select End Time</Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Validate that end time is after start time
                        if (tempEndTime <= selectedTime) {
                          const adjustedEndTime = new Date(selectedTime);
                          adjustedEndTime.setHours(
                            adjustedEndTime.getHours() + 1,
                          );
                          setMealEndTime(adjustedEndTime);

                          showTimeValidationWarning(() => {
                            console.log(
                              'End time automatically adjusted to be after start time',
                            );
                          });
                        } else {
                          setMealEndTime(tempEndTime);
                        }
                        setShowEndTimePicker(false);

                        // Trigger availability check
                        const finalEndTime =
                          tempEndTime <= selectedTime
                            ? new Date(selectedTime.getTime() + 60 * 60 * 1000)
                            : tempEndTime;

                        setTimeout(() => {
                          if (friends.length > 0) {
                            checkAllFriendsAvailability(
                              selectedDate,
                              selectedTime,
                              finalEndTime,
                            );
                          }
                          if (squads.length > 0) {
                            checkSquadsAvailability(
                              selectedDate,
                              selectedTime,
                              finalEndTime,
                            );
                          }
                        }, 100);
                      }}
                    >
                      <Text style={localStyles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempEndTime}
                    mode="time"
                    display="spinner"
                    onChange={handleEndTimeChange}
                    style={localStyles.picker}
                  />
                </View>
              )}

              <Text style={localStyles.modalLabel}>Location:</Text>
              <View style={localStyles.locationOptionsContainer}>
                {LOCATION_OPTIONS.map(renderLocationOption)}
              </View>

              <Text style={localStyles.modalLabel}>Notes (optional):</Text>
              <TextInput
                style={[localStyles.textInput, localStyles.textArea]}
                placeholder="Add notes about the meal"
                value={notes}
                onChangeText={setNotes}
                mode="flat"
                multiline={true}
                numberOfLines={4}
              />

              {selectedFriends.length > 0 && (
                <>
                  <Text style={localStyles.modalLabel}>Selected Friends:</Text>
                  <View style={localStyles.selectedList}>
                    {selectedFriends.map((item) => {
                      const friendData = friends.find((f) => f.id === item.id);
                      const isAvailable = friendAvailability[item.id];
                      return (
                        <View
                          key={item.id}
                          style={[
                            localStyles.selectedItemChip,
                            isAvailable === false && localStyles.busyChip,
                          ]}
                        >
                          <Text
                            style={
                              isAvailable === false
                                ? localStyles.busyChipText
                                : null
                            }
                          >
                            {friendData ? friendData.name : item.id}
                            {isAvailable === false && ' (Busy)'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {selectedSquads.length > 0 && (
                <>
                  <Text style={localStyles.modalLabel}>Selected Squads:</Text>
                  <View style={localStyles.selectedList}>
                    {selectedSquads.map((squadId) => {
                      const squadData = squads.find((s) => s._id === squadId);
                      return (
                        <View
                          key={squadId}
                          style={localStyles.selectedItemChip}
                        >
                          <Text>
                            {squadData ? squadData.squadName : 'Unknown Squad'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={localStyles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDetailsModal(false)}
                style={localStyles.modalButton}
              >
                Close
              </Button>
              <Button
                mode="contained"
                onPress={scheduleMeal}
                style={localStyles.modalButton}
                loading={loading}
                disabled={!mealName || showDatePicker || showTimePicker}
              >
                Schedule Meal
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {renderScheduleModal()}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    minHeight: '100%',
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
    width: '75%',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ddd',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  dateTimeButton: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 5,
  },
  dtbInactive: {
    backgroundColor: 'lightgray',
    pointerEvents: 'none',
  },
  dtbActive: {
    backgroundColor: '#6750a4',
    ...BOX_SHADOW,
  },
  dateTimeText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  arrowRight: {
    paddingLeft: 5,
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  listContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 15,
    marginBottom: 10,
  },
  friendsList: {
    width: '100%',
    borderRadius: 15,
  },
  friendsListContent: {
    paddingHorizontal: 0,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e6ff',
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    // paddingHorizontal: 15,
  },
  busyItem: {
    backgroundColor: '#ffebee',
  },
  availableItem: {
    backgroundColor: '#e9e6ff',
  },
  squadItem: {
    backgroundColor: '#f8f8ff',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  squadMembersCount: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  partiallyBusyText: {
    color: '#f57c00',
  },
  busyMembersNote: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 2,
    fontStyle: 'italic',
  },
  selectedItem: {
    backgroundColor: '#6750a4',
  },
  selectedText: {
    color: '#fff',
  },
  avatarContainer: {
    marginRight: 15,
    position: 'relative',
  },
  avatar: {
    backgroundColor: 'white',
  },
  busyAvatar: {
    backgroundColor: '#ffcdd2',
  },
  availableAvatar: {
    backgroundColor: '#c8e6c9',
  },
  busyIconContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  availableIconContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
    color: '#555',
  },
  busyText: {
    color: '#d32f2f',
  },
  checkboxContainer: {
    marginLeft: 10,
  },
  bottomButton: {
    width: '100%',
    backgroundColor: '#CBDBA7',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  scheduleNowButton: {
    paddingVertical: 5,
  },
  scheduleNowText: {
    fontSize: 16,
    color: '#5C4D7D',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
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
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    height: '65%',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: '90%%',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
  },
  textInput: {
    height: 40,
  },
  textInputContent: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingLeft: 10,
  },
  textInputBorder: {
    borderRadius: 10,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  timeWarning: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 15,
    ...BOX_SHADOW,
  },
  selectedList: {
    paddingTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectedItemChip: {
    backgroundColor: '#e9e6ff',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginVertical: -5,
  },
  busyChip: {
    backgroundColor: '#ffcdd2',
  },
  busyChipText: {
    color: '#d32f2f',
  },
  locationOptionsContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationOptionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#5C4D7D',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 5,
    marginBottom: 15,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerCancel: {
    color: '#5C4D7D',
    fontSize: 16,
  },
  pickerDone: {
    color: '#5C4D7D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    height: 200,
    width: '100%',
  },
  divider: {
    marginBottom: 15,
  },
  scheduleScrollView: {
    maxHeight: 400,
    marginBottom: 15,
    flex: 0,
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
  selectedMealDay: {
    backgroundColor: '#E8F5D9',
    padding: 4,
    borderRadius: 4,
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
  weekRangeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  closeModalButton: {
    backgroundColor: '#5C4D7D',
  },
});

export default ScheduleMeal;
