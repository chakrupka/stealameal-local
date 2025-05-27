import React, { useState, useRef, useEffect, useCallback } from 'react';
import TopNav from '../components/TopNav';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Card, Divider } from 'react-native-paper';
import useStore from '../store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAvailability } from '../services/availability-api';

const CalendarView = ({ navigation }) => {
  const [currentDate] = useState(new Date());
  const flatListRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const screenWidth = Dimensions.get('window').width;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [userAvailability, setUserAvailability] = useState(null);

  // add meals state and fetch function
  const [meals, setMeals] = useState([]);
  const getAllMeals = useStore((state) => state.mealSlice.getAllMeals);
  const currentUser = useStore((state) => state.userSlice.currentUser);

  // generate time slots from 7:30 am to 8:30 pm
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 20; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;

      // add half hour
      if (hour === 7) {
        slots.push({
          time: `${displayHour}:30 ${period}`,
          hour: hour,
          minute: 30,
        });
      }
      // add full hour
      else {
        slots.push({
          time: `${displayHour}:00 ${period}`,
          hour: hour,
          minute: 0,
        });

        // add half hour
        if (hour < 20) {
          slots.push({
            time: `${displayHour}:30 ${period}`,
            hour: hour,
            minute: 30,
          });
        }
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // get dates for a week
  const getWeekDates = (baseDate) => {
    const date = new Date(baseDate);
    // set to start of the week
    date.setDate(date.getDate() - date.getDay());

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(date);
      day.setDate(day.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  // generate array of week arrays with more past weeks
  const generateWeeks = useCallback(() => {
    const weeks = [];

    // add 4 previous weeks instead of just 1
    for (let i = 4; i >= 1; i--) {
      const prevWeekDate = new Date(currentDate);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7 * i);
      weeks.push(getWeekDates(prevWeekDate));
    }

    weeks.push(getWeekDates(currentDate));

    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    weeks.push(getWeekDates(nextWeekDate));

    const nextTwoWeeksDate = new Date(nextWeekDate);
    nextTwoWeeksDate.setDate(nextTwoWeeksDate.getDate() + 7);
    weeks.push(getWeekDates(nextTwoWeeksDate));

    return weeks;
  }, [currentDate]);

  const [weeks, setWeeks] = useState(() => generateWeeks());
  const [currentWeekIndex, setCurrentWeekIndex] = useState(4);

  // format the week range display
  const formatWeekRange = useCallback((weekDates) => {
    if (!weekDates || weekDates.length < 7) return 'Loading...';

    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
  }, []);

  // check if the date is today
  const isToday = useCallback((date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // check if date is selected
  const isSelected = useCallback(
    (date) => {
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    },
    [selectedDate],
  );

  const handleScroll = useCallback(
    (event) => {
      if (isScrolling) return;

      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const viewSize = event.nativeEvent.layoutMeasurement.width;
      const newIndex = Math.round(contentOffsetX / viewSize);

      if (newIndex !== currentWeekIndex) {
        setCurrentWeekIndex(newIndex);

        if (newIndex === weeks.length - 1) {
          // add next week
          const lastWeek = weeks[weeks.length - 1];
          const nextWeekStart = new Date(lastWeek[6]);
          nextWeekStart.setDate(nextWeekStart.getDate() + 1);
          const nextWeek = getWeekDates(nextWeekStart);
          setWeeks((prevWeeks) => [...prevWeeks, nextWeek]);

          // fetch meals when adding new weeks
          fetchMeals();
        }

        // add more weeks if needed when scrolling backward
        else if (newIndex === 0) {
          setIsScrolling(true);

          const firstWeek = weeks[0];
          const prevWeekStart = new Date(firstWeek[0]);
          prevWeekStart.setDate(prevWeekStart.getDate() - 7);
          const prevWeek = getWeekDates(prevWeekStart);

          setWeeks((prevWeeks) => [prevWeek, ...prevWeeks]);

          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({
                index: 1,
                animated: false,
              });

              setTimeout(() => {
                setIsScrolling(false);
              }, 100);
            }
          }, 10);

          fetchMeals();
        }
      }
    },
    [weeks, currentWeekIndex, isScrolling],
  );

  // calculate day column width
  const getDayWidth = useCallback(() => {
    const containerPadding = 16 * 2; // horizontal padding
    const timeColumnWidth = 60; // width for time labels column
    const availableWidth = screenWidth - containerPadding - timeColumnWidth;
    return Math.floor(availableWidth / 7); // divide by 7 days
  }, [screenWidth]);

  useEffect(() => {
    const loadUserAvailability = async () => {
      try {
        const availability = await getAvailability(currentUser.idToken);
        setUserAvailability(availability);
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    };

    if (currentUser) {
      fetchMeals();
      loadUserAvailability();
    }
  }, [currentUser]);

  const onScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: 4,
          animated: false,
        });
      }
    }, 100);
  }, []);

  // fetch function for meals
  const fetchMeals = useCallback(async () => {
    try {
      const allMeals = await getAllMeals();
      if (allMeals && Array.isArray(allMeals)) {
        // filter relevant meals for current user (similar to ViewMeals)
        const relevantMeals = allMeals.filter(
          (meal) =>
            (meal.host &&
              ((typeof meal.host === 'object' &&
                meal.host._id === currentUser._id) ||
                (typeof meal.host === 'string' &&
                  meal.host === currentUser._id))) ||
            (meal.participants &&
              meal.participants.some(
                (p) =>
                  p.userID &&
                  (p.userID._id === currentUser._id ||
                    p.userID === currentUser._id ||
                    (typeof p.userID === 'string' &&
                      p.userID === currentUser.userID)),
              )),
        );
        setMeals(relevantMeals);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      Alert.alert('Error', 'Failed to load meals');
    }
  }, [getAllMeals, currentUser]);

  // fetch meals on component mount and setup refresh interval
  useEffect(() => {
    if (currentUser) {
      fetchMeals();

      // add a refresh interval to periodically check for new meals
      const refreshInterval = setInterval(() => {
        fetchMeals();
      }, 60000); // refresh every minute

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [currentUser, fetchMeals]);

  // function to get meals for a specific date and time slot
  const getMealsForSlot = (date, hour, minute) => {
    if (!meals || !Array.isArray(meals)) return [];

    return meals.filter((meal) => {
      if (!meal.date || !meal.time) return false;

      const mealDate = new Date(meal.date);
      const isSameDate =
        mealDate.getDate() === date.getDate() &&
        mealDate.getMonth() === date.getMonth() &&
        mealDate.getFullYear() === date.getFullYear();

      if (!isSameDate) return false;

      // parse meal time (handling different possible formats)
      const timeStr = meal.time;
      let mealHour, mealMinute;

      // handle format
      if (timeStr.includes(':')) {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          [mealHour, mealMinute] = time.split(':').map(Number);

          if (period === 'PM' && mealHour < 12) mealHour += 12;
          if (period === 'AM' && mealHour === 12) mealHour = 0;
        } else {
          [mealHour, mealMinute] = timeStr.split(':').map(Number);
        }
      } else {
        // if only hour is specified, default to on the hour
        mealHour = parseInt(timeStr, 10);
        mealMinute = 0;
      }

      // check if the meal time is within 15 minutes of the time slot
      // this allows meals to show at the closest time slot
      const mealTimeInMinutes = mealHour * 60 + mealMinute;
      const slotTimeInMinutes = hour * 60 + minute;

      return Math.abs(mealTimeInMinutes - slotTimeInMinutes) <= 15;
    });
  };

  // handle meal click to show details
  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };
  const getScheduleItemsForSlot = (date, hour, minute) => {
    if (!userAvailability?.availability) return [];

    const dayOfWeek = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][date.getDay()];
    const allItems = [
      ...userAvailability.availability.classes.map((item) => ({
        ...item,
        category: 'classes',
      })),
      ...userAvailability.availability.sporting.map((item) => ({
        ...item,
        category: 'sporting',
      })),
      ...userAvailability.availability.extracurricular.map((item) => ({
        ...item,
        category: 'extracurricular',
      })),
      ...userAvailability.availability.other.map((item) => ({
        ...item,
        category: 'other',
      })),
    ];

    return allItems.filter((item) => {
      // Check if item is active on this date
      if (!isItemActiveOnDate(item, date, dayOfWeek)) {
        return false;
      }

      // Check if item's time overlaps with this time slot
      return isItemActiveAtTime(item, hour, minute);
    });
  };

  const isItemActiveOnDate = (item, checkDate, dayOfWeek) => {
    // Handle specific date items (from "other" category)
    if (item.occurrenceType === 'specific') {
      if (!item.specificDate) return false;
      const specificDate = new Date(item.specificDate);
      return (
        specificDate.getFullYear() === checkDate.getFullYear() &&
        specificDate.getMonth() === checkDate.getMonth() &&
        specificDate.getDate() === checkDate.getDate()
      );
    }

    // Handle weekly recurring items
    if (!item.days || !item.days.includes(dayOfWeek)) return false;

    // Check if within date range
    if (item.startDate && checkDate < new Date(item.startDate)) return false;
    if (item.endDate && checkDate > new Date(item.endDate)) return false;

    return true;
  };

  const isItemActiveAtTime = (item, hour, minute) => {
    if (!item.startTime || !item.endTime) return false;

    const itemStart = new Date(item.startTime);
    const itemEnd = new Date(item.endTime);

    const slotTime = new Date();
    slotTime.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots

    // Check if the time slot overlaps with the item's time
    return (
      itemStart.getHours() * 60 + itemStart.getMinutes() <
        slotEnd.getHours() * 60 + slotEnd.getMinutes() &&
      itemEnd.getHours() * 60 + itemEnd.getMinutes() >
        slotTime.getHours() * 60 + slotTime.getMinutes()
    );
  };

  const getScheduleItemBackgroundColor = (category) => {
    switch (category) {
      case 'classes':
        return '#2196f380';
      case 'sporting':
        return '#4caf5080';
      case 'extracurricular':
        return '#fbc02d80';
      case 'other':
        return '#f4433680';
      default:
        return '#9e9e9e50';
    }
  };

  const getScheduleItemBorderColor = (category) => {
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
        return '#9e9e9e';
    }
  };
  // format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // get user's status in the meal
  const getUserStatus = (meal) => {
    if (!meal || !currentUser) return 'unknown';

    // check if user is host
    if (meal.host) {
      if (
        (typeof meal.host === 'object' && meal.host._id === currentUser._id) ||
        (typeof meal.host === 'string' && meal.host === currentUser._id)
      ) {
        return 'host';
      }
    }

    // find user in participants
    const participant =
      meal.participants &&
      meal.participants.find(
        (p) =>
          p.userID &&
          (p.userID._id === currentUser._id ||
            p.userID === currentUser._id ||
            (typeof p.userID === 'string' && p.userID === currentUser.userID)),
      );

    return participant ? participant.status : 'unknown';
  };

  // get background color for meal based on user's status
  const getMealBackgroundColor = (meal) => {
    if (new Date(meal.date) < new Date()) {
      return '#f5f5f550'; // past meal
    }

    const status = getUserStatus(meal);
    switch (status) {
      case 'host':
        return '#2196f380';
      case 'confirmed':
        return '#4caf5080';
      case 'invited':
        return '#fbc02d80';
      case 'declined':
        return '#f4433680';
      default:
        return '#9e9e9e50';
    }
  };

  // get border color for meal based on user's status
  const getMealBorderColor = (meal) => {
    if (new Date(meal.date) < new Date()) {
      return '#9e9e9e'; // past meal
    }

    const status = getUserStatus(meal);
    switch (status) {
      case 'host':
        return '#2196f3';
      case 'confirmed':
        return '#4caf50';
      case 'invited':
        return '#fbc02d';
      case 'declined':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  // get host name display
  const getHostName = (meal) => {
    if (!meal.host) return 'Unknown Host';

    if (typeof meal.host === 'object') {
      return meal.host.firstName && meal.host.lastName
        ? `${meal.host.firstName} ${meal.host.lastName}`
        : 'Unknown Host';
    }

    if (meal.host === currentUser._id) {
      return 'You';
    }

    return 'Unknown Host';
  };

  // manual refresh button
  const handleRefresh = () => {
    fetchMeals();
    Alert.alert('Calendar Refreshed', 'Your meal calendar has been refreshed.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNav navigation={navigation} title="Your Calendar" />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.contentContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekRangeText}>
            {formatWeekRange(weeks[currentWeekIndex])}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={weeks}
          initialScrollIndex={4}
          keyExtractor={(item, index) => `week-${index}`}
          renderItem={({ item: weekDates }) => (
            <View style={[styles.weekContainer, { width: screenWidth }]}>
              <View style={styles.timeColumnHeader}>
                <Text style={styles.timeColumnLabel}></Text>
              </View>

              {weekDates.map((date, dayIndex) => {
                const dayWidth = getDayWidth();
                return (
                  <TouchableOpacity
                    key={`day-${dayIndex}`}
                    style={[
                      styles.dayContainer,
                      { width: dayWidth },
                      isToday(date) && styles.todayDay,
                      isSelected(date) && styles.selectedDay,
                    ]}
                    onPress={() => setSelectedDate(new Date(date))}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        isToday(date) && styles.todayText,
                        isSelected(date) && styles.selectedText,
                      ]}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday(date) && styles.todayText,
                        isSelected(date) && styles.selectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(data, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />

        <ScrollView style={styles.scheduleContainer}>
          {timeSlots.map((slot, index) => (
            <View key={`time-${index}`} style={styles.timeSlotRow}>
              {/* time label */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{slot.time}</Text>
              </View>

              <View style={styles.dayColumnsContainer}>
                {weeks[currentWeekIndex].map((date, dayIndex) => {
                  const slotMeals = getMealsForSlot(
                    date,
                    slot.hour,
                    slot.minute,
                  );
                  const scheduleItems = getScheduleItemsForSlot(
                    date,
                    slot.hour,
                    slot.minute,
                  );

                  return (
                    <View
                      key={`slot-${index}-day-${dayIndex}`}
                      style={[styles.scheduleSlot, { width: getDayWidth() }]}
                    >
                      {/* Render meals */}
                      {slotMeals.length > 0 &&
                        slotMeals.map((meal, mealIndex) => (
                          <TouchableOpacity
                            key={`meal-${meal._id}-${mealIndex}`}
                            style={[
                              styles.mealItem,
                              {
                                backgroundColor: getMealBackgroundColor(meal),
                                borderLeftColor: getMealBorderColor(meal),
                                top: 2,
                                height: scheduleItems.length > 0 ? 28 : 56, // Smaller if sharing space
                              },
                            ]}
                            onPress={() => handleMealClick(meal)}
                          >
                            <Text style={styles.mealName} numberOfLines={1}>
                              {meal.mealName || 'Meal'}
                            </Text>
                            <Text style={styles.mealType} numberOfLines={1}>
                              {meal.mealType || ''}
                            </Text>
                          </TouchableOpacity>
                        ))}

                      {/* Render schedule items */}
                      {scheduleItems.length > 0 &&
                        scheduleItems.map((item, itemIndex) => (
                          <View
                            key={`schedule-${itemIndex}`}
                            style={[
                              styles.scheduleItem,
                              {
                                backgroundColor: getScheduleItemBackgroundColor(
                                  item.category,
                                ),
                                borderLeftColor: getScheduleItemBorderColor(
                                  item.category,
                                ),
                                top: slotMeals.length > 0 ? 30 : 2, // Below meals if present
                                height: slotMeals.length > 0 ? 28 : 56,
                              },
                            ]}
                          >
                            <Text
                              style={styles.scheduleItemName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={styles.scheduleItemCategory}
                              numberOfLines={1}
                            >
                              {item.category}
                            </Text>
                          </View>
                        ))}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedMeal && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedMeal.mealName || 'Unnamed Meal'}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color="#6750a4"
                      />
                    </TouchableOpacity>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.modalDetailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={styles.detailValue}>
                        {getUserStatus(selectedMeal) === 'host'
                          ? 'You are hosting'
                          : getUserStatus(selectedMeal) === 'confirmed'
                          ? 'You are attending'
                          : getUserStatus(selectedMeal) === 'invited'
                          ? 'Invitation pending'
                          : getUserStatus(selectedMeal) === 'declined'
                          ? 'You declined'
                          : 'Unknown'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Host:</Text>
                      <Text style={styles.detailValue}>
                        {getHostName(selectedMeal)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedMeal.date)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMeal.time || 'Not specified'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMeal.location || 'Not specified'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMeal.mealType
                          ? selectedMeal.mealType.charAt(0).toUpperCase() +
                            selectedMeal.mealType.slice(1)
                          : 'Not specified'}
                      </Text>
                    </View>

                    {selectedMeal.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={[styles.detailValue, styles.notesText]}>
                          {selectedMeal.notes}
                        </Text>
                      </View>
                    )}

                    <View style={styles.attendeesSection}>
                      <Text style={styles.detailLabel}>Attendees:</Text>
                      <View style={styles.attendeesList}>
                        {selectedMeal.participants &&
                          selectedMeal.participants.map((p, index) => {
                            let name = 'Unknown';
                            if (p.userID) {
                              if (typeof p.userID === 'object') {
                                name =
                                  p.userID.firstName && p.userID.lastName
                                    ? `${p.userID.firstName} ${p.userID.lastName}`
                                    : 'Unknown';
                              } else if (
                                p.userID === currentUser._id ||
                                p.userID === currentUser.userID
                              ) {
                                name = 'You';
                              }
                            }

                            return (
                              <Text
                                key={`attendee-${index}`}
                                style={styles.attendeeItem}
                              >
                                • {name} ({p.status})
                              </Text>
                            );
                          })}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('ViewMeals');
                    }}
                  >
                    <Text style={styles.viewDetailsButtonText}>
                      View All Meals
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  weekHeader: {
    paddingTop: 55,
    paddingBottom: 15,
    marginBottom: 1,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    overflow: 'visible',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6750a4',
  },
  refreshButton: {
    position: 'absolute',
    right: 20,
    top: 55,
    padding: 5,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 10,
    paddingBottom: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  timeColumnHeader: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeColumnLabel: {
    fontSize: 12,
    color: '#999',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 10,
    height: 60,
  },
  todayDay: {
    backgroundColor: 'rgba(92, 77, 125, 0.1)',
  },
  selectedDay: {
    backgroundColor: '#6750a4',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  todayText: {
    color: '#6750a4',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
  },
  selectedDateContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 30,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750a4',
    textAlign: 'center',
  },
  scheduleContainer: {
    flexGrow: 1,
  },
  timeSlotRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.5)',
    height: 60,
  },
  timeColumn: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  dayColumnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  scheduleSlot: {
    height: 60,
    borderRightWidth: 1,
    borderRightColor: 'rgba(240, 240, 240, 0.5)',
    position: 'relative',
  },
  mealItem: {
    position: 'absolute',
    top: 2,
    left: 1,
    right: 1,
    bottom: 2,
    borderRadius: 4,
    padding: 4,
    justifyContent: 'center',
    borderLeftWidth: 3,
    elevation: 1,
  },
  mealName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  mealType: {
    fontSize: 8,
    color: '#666',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
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
    color: '#6750a4',
  },
  divider: {
    marginBottom: 15,
  },
  modalDetailsContainer: {
    maxHeight: '80%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 80,
    color: '#333',
  },
  detailValue: {
    flex: 1,
    color: '#444',
  },
  notesText: {
    fontStyle: 'italic',
  },
  attendeesSection: {
    marginTop: 10,
  },
  attendeesList: {
    marginTop: 5,
  },
  attendeeItem: {
    marginBottom: 5,
    paddingLeft: 5,
    color: '#444',
  },
  viewDetailsButton: {
    backgroundColor: '#6750a4',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CalendarView;
