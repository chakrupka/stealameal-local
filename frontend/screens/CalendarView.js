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
  RefreshControl // Added RefreshControl import here
} from 'react-native';
import { Card, Divider } from 'react-native-paper';
import useStore from '../store'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const CalendarView = ({navigation}) => {
  const [currentDate] = useState(new Date());
  const flatListRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const screenWidth = Dimensions.get('window').width;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add a refresh trigger state

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
          minute: 30
        });
      }
      // add full hour
      else {
        slots.push({
          time: `${displayHour}:00 ${period}`,
          hour: hour,
          minute: 0
        });
        
        // add half hour except for the last entry (8:30 PM)
        if (hour < 20) {
          slots.push({
            time: `${displayHour}:30 ${period}`,
            hour: hour,
            minute: 30
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
    // set to start of the week (sunday)
    date.setDate(date.getDate() - date.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(date);
      day.setDate(day.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  // generate initial weeks array (including past weeks)
  const generateInitialWeeks = useCallback(() => {
    const weeks = [];
    
    // Add several past weeks (4 weeks back)
    for (let i = 4; i > 0; i--) {
      const pastWeekDate = new Date(currentDate);
      pastWeekDate.setDate(pastWeekDate.getDate() - (7 * i));
      weeks.push(getWeekDates(pastWeekDate));
    }
    
    // Current week
    weeks.push(getWeekDates(currentDate));
    
    // Add several future weeks (4 weeks forward)
    for (let i = 1; i <= 4; i++) {
      const futureWeekDate = new Date(currentDate);
      futureWeekDate.setDate(futureWeekDate.getDate() + (7 * i));
      weeks.push(getWeekDates(futureWeekDate));
    }
    
    return weeks;
  }, [currentDate]);

  const [weeks, setWeeks] = useState(() => generateInitialWeeks());
  const [currentWeekIndex, setCurrentWeekIndex] = useState(4); // Start with current week (after 4 past weeks)

  // format the week range display
  const formatWeekRange = useCallback((weekDates) => {
    if (!weekDates || weekDates.length < 7) return "Loading...";
    
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
    return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
  }, []);

  // check if date is selected
  const isSelected = useCallback((date) => {
    return date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear();
  }, [selectedDate]);

  // handle flatList scroll for weeks with infinite scrolling
  const handleScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(contentOffsetX / viewSize);
    
    if (newIndex !== currentWeekIndex) {
      setCurrentWeekIndex(newIndex);
      
      // Add more weeks if needed (infinite scrolling both directions)
      if (newIndex <= 1) {
        // Add more past weeks when approaching the beginning
        const firstWeek = weeks[0];
        const newPastWeekStart = new Date(firstWeek[0]);
        newPastWeekStart.setDate(newPastWeekStart.getDate() - 7);
        const newPastWeek = getWeekDates(newPastWeekStart);
        setWeeks([newPastWeek, ...weeks]);
        // Adjust currentWeekIndex to maintain position after new week is added
        setCurrentWeekIndex(newIndex + 1);
        // Scroll to maintain position
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: newIndex + 1,
            animated: false
          });
        }
      } else if (newIndex >= weeks.length - 2) {
        // Add more future weeks when approaching the end
        const lastWeek = weeks[weeks.length - 1];
        const newFutureWeekStart = new Date(lastWeek[6]);
        newFutureWeekStart.setDate(newFutureWeekStart.getDate() + 1);
        const newFutureWeek = getWeekDates(newFutureWeekStart);
        setWeeks([...weeks, newFutureWeek]);
      }
    }
  }, [weeks, currentWeekIndex]);

  // calculate day column width
  const getDayWidth = useCallback(() => {
    const containerPadding = 16 * 2; // horizontal padding
    const timeColumnWidth = 60; // width for time labels column
    const availableWidth = screenWidth - containerPadding - timeColumnWidth;
    return Math.floor(availableWidth / 7); // divide by 7 days
  }, [screenWidth]);

  // initial scroll to current week
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: 4, // current week index (after 4 past weeks)
          animated: false
        });
      }, 100);
    }
  }, []);

  // handle scroll failures
  const onScrollToIndexFailed = useCallback((info) => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: info.index,
          animated: false
        });
      }
    }, 100);
  }, []);

  // Create a dedicated fetch meals function
  const fetchMeals = async () => {
    try {
      if (!currentUser) return;
      
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
  };

  // Fetch meals when component mounts or week changes
  useEffect(() => {
    fetchMeals();
  }, [currentUser, currentWeekIndex, weeks.length, refreshTrigger]);

  // Add useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // This will run when the screen comes into focus
      fetchMeals();
      
      // Optional: Set up a periodic refresh while screen is focused
      const intervalId = setInterval(() => {
        setRefreshTrigger(prev => prev + 1); // Trigger a refresh every few seconds
      }, 10000); // Refresh every 10 seconds
      
      // Cleanup on blur
      return () => {
        clearInterval(intervalId);
      };
    }, [currentUser])
  );

  // function to get meals for a specific date and time slot
  const getMealsForSlot = (date, hour, minute) => {
    if (!meals || !Array.isArray(meals)) return [];
    
    return meals.filter(meal => {
      if (!meal.date || !meal.time) return false;
        
      const mealDate = new Date(meal.date);
      const isSameDate = mealDate.getDate() === date.getDate() &&
                        mealDate.getMonth() === date.getMonth() &&
                        mealDate.getFullYear() === date.getFullYear();
        
      if (!isSameDate) return false;
        
      // parse meal time (handling different possible formats)
      const timeStr = meal.time;
      let mealHour, mealMinute;
      
      // handle format "2:30 PM" or "14:30"
      if (timeStr.includes(':')) {
        // check if it has AM/PM
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          [mealHour, mealMinute] = time.split(':').map(Number);
          
          if (period === 'PM' && mealHour < 12) mealHour += 12;
          if (period === 'AM' && mealHour === 12) mealHour = 0;
        } else {
          // 24-hour format
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

  // navigate to view meal details
  const navigateToMealDetails = (meal) => {
    if (meal && meal._id) {
      setModalVisible(false);
      navigation.navigate('MealDetail', { mealId: meal._id });
    }
  };

  // get user's status in the meal
  const getUserStatus = (meal) => {
    if (!meal || !currentUser) return 'unknown';
    
    // check if user is host
    if (meal.host) {
      if ((typeof meal.host === 'object' && meal.host._id === currentUser._id) ||
          (typeof meal.host === 'string' && meal.host === currentUser._id)) {
        return 'host';
      }
    }

    // find user in participants
    const participant = meal.participants && meal.participants.find(
      (p) => p.userID && 
        (p.userID._id === currentUser._id ||
         p.userID === currentUser._id ||
         (typeof p.userID === 'string' && p.userID === currentUser.userID))
    );

    return participant ? participant.status : 'unknown';
  };

  // get background color for meal based on user's status
  const getMealBackgroundColor = (meal) => {
    if (new Date(meal.date) < new Date()) {
      return '#f5f5f550'; // past meal (semi-transparent)
    }

    const status = getUserStatus(meal);
    switch (status) {
      case 'host':
        return '#2196f380'; // blue with transparency
      case 'confirmed':
        return '#4caf5080'; // green with transparency
      case 'invited':
        return '#fbc02d80'; // yellow with transparency
      case 'declined':
        return '#f4433680'; // red with transparency
      default:
        return '#9e9e9e50'; // grey with transparency
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
        return '#2196f3'; // blue
      case 'confirmed':
        return '#4caf50'; // green
      case 'invited':
        return '#fbc02d'; // yellow
      case 'declined':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // grey
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

  // Add a manual refresh function that can be called from a pull-to-refresh or button
  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNav navigation={navigation} title="Your Calendar" />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.contentContainer}>
        {/* week header with dates */}
        <View style={styles.weekHeader}>
          <Text style={styles.weekRangeText}>
            {formatWeekRange(weeks[currentWeekIndex])}
          </Text>
          
          {/* Add refresh button */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleManualRefresh}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#5C4D7D" />
          </TouchableOpacity>
        </View>

        {/* day labels */}
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={weeks}
          initialScrollIndex={4} // Start with current week (after 4 past weeks)
          keyExtractor={(item, index) => `week-${index}`}
          renderItem={({ item: weekDates }) => (
            <View style={[styles.weekContainer, { width: screenWidth }]}>
              {/* time column label (empty) */}
              <View style={styles.timeColumnHeader}>
                <Text style={styles.timeColumnLabel}></Text>
              </View>
              
              {/* day labels */}
              {weekDates.map((date, dayIndex) => {
                const dayWidth = getDayWidth();
                return (
                  <TouchableOpacity
                    key={`day-${dayIndex}`}
                    style={[
                      styles.dayContainer,
                      { width: dayWidth },
                      isToday(date) && styles.todayDay,
                      isSelected(date) && styles.selectedDay
                    ]}
                    onPress={() => setSelectedDate(new Date(date))}
                  >
                    <Text style={[
                      styles.dayName,
                      isToday(date) && styles.todayText,
                      isSelected(date) && styles.selectedText
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday(date) && styles.todayText,
                        isSelected(date) && styles.selectedText
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
          maxToRenderPerBatch={3}
          windowSize={5}
        />
        
        {/* time slots and schedule grid with meals */}
        <ScrollView 
          style={styles.scheduleContainer}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleManualRefresh}
              colors={['#5C4D7D']}
            />
          }
        >
          {timeSlots.map((slot, index) => (
            <View key={`time-${index}`} style={styles.timeSlotRow}>
              {/* time label */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{slot.time}</Text>
              </View>
              
              {/* day columns with meals */}
              <View style={styles.dayColumnsContainer}>
                {weeks[currentWeekIndex] && weeks[currentWeekIndex].map((date, dayIndex) => {
                  const slotMeals = getMealsForSlot(date, slot.hour, slot.minute);
                  return (
                    <View
                      key={`slot-${index}-day-${dayIndex}`}
                      style={[
                        styles.scheduleSlot,
                        { width: getDayWidth() }
                      ]}
                    >
                      {slotMeals.length > 0 && slotMeals.map((meal, mealIndex) => (
                        <TouchableOpacity
                          key={`meal-${meal._id}-${mealIndex}`}
                          style={[
                            styles.mealItem,
                            {
                              backgroundColor: getMealBackgroundColor(meal),
                              borderLeftColor: getMealBorderColor(meal),
                            }
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
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* selected date display */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
        
        {/* meal details modal */}
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
                    <Text style={styles.modalTitle}>{selectedMeal.mealName || 'Unnamed Meal'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialCommunityIcons name="close" size={24} color="#5C4D7D" />
                    </TouchableOpacity>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <ScrollView style={styles.modalDetailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={styles.detailValue}>
                        {getUserStatus(selectedMeal) === 'host' ? 'You are hosting' :
                         getUserStatus(selectedMeal) === 'confirmed' ? 'You are attending' :
                         getUserStatus(selectedMeal) === 'invited' ? 'Invitation pending' :
                         getUserStatus(selectedMeal) === 'declined' ? 'You declined' : 'Unknown'}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Host:</Text>
                      <Text style={styles.detailValue}>{getHostName(selectedMeal)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedMeal.date)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time:</Text>
                      <Text style={styles.detailValue}>{selectedMeal.time || 'Not specified'}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>{selectedMeal.location || 'Not specified'}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMeal.mealType ? selectedMeal.mealType.charAt(0).toUpperCase() + selectedMeal.mealType.slice(1) : 'Not specified'}
                      </Text>
                    </View>
                    
                    {selectedMeal.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={[styles.detailValue, styles.notesText]}>{selectedMeal.notes}</Text>
                      </View>
                    )}
                    
                    <View style={styles.attendeesSection}>
                      <Text style={styles.detailLabel}>Attendees:</Text>
                      <View style={styles.attendeesList}>
                        {selectedMeal.participants && selectedMeal.participants.map((p, index) => {
                          let name = 'Unknown';
                          if (p.userID) {
                            if (typeof p.userID === 'object') {
                              name = p.userID.firstName && p.userID.lastName
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
                            <Text key={`attendee-${index}`} style={styles.attendeeItem}>
                              • {name} ({p.status})
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                  
                  <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.viewMealButton}
                      onPress={() => navigateToMealDetails(selectedMeal)}
                    >
                      <Text style={styles.viewMealButtonText}>View Full Details</Text>
                    </TouchableOpacity>
                  </View>
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
    paddingVertical: 16,  
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4D7D',
  },
  refreshButton: {
    position: 'absolute',
    right: 16,
    padding: 5,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    backgroundColor: '#5C4D7D',
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
    color: '#5C4D7D',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
  },
  selectedDateContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C4D7D',
    textAlign: 'center',
  },
  scheduleContainer: {
    flex: 1,
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
  // Modal styles
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
    color: '#5C4D7D',
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
    backgroundColor: '#5C4D7D',
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
 