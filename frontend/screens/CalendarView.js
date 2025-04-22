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
  Dimensions
} from 'react-native';

const CalendarView = ({navigation}) => {
  // starting date (January 1, 2025)
  const START_DATE = new Date(2025, 0, 1);
  const [currentDate] = useState(new Date());
  const flatListRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const screenWidth = Dimensions.get('window').width;

  // generate array of weeks starting from 2025
  const generateWeeks = useCallback((startWeekIndex) => {
    const weeks = [];
    // generate weeks before and after the current week for infinite scroll effect
    for (let i = -10; i <= 10; i++) {
      const weekStart = new Date(START_DATE);
      weekStart.setDate(weekStart.getDate() + (startWeekIndex + i) * 7);
      weeks.push(getWeekDates(weekStart));
    }
    return weeks;
  }, []);

  // get all dates for a week starting from the given date
  const getWeekDates = (date) => {
    const weekStart = new Date(date);
    // adjust to start of week (Sunday)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  // calculate initial week index (how many weeks from START_DATE)
  const getWeekIndex = useCallback((date) => {
    const diffTime = Math.abs(date - START_DATE);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  }, []);

  const initialWeekIndex = getWeekIndex(currentDate);
  const [weeks, setWeeks] = useState(() => generateWeeks(initialWeekIndex));
  const [currentWeekIndex, setCurrentWeekIndex] = useState(10); // Middle of our array (we generate -10 to +10)

  // handle scroll to maintain infinite scroll illusion
  const handleScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    
    // Calculate which item is in the center of the view
    const newIndex = Math.round(contentOffsetX / viewSize);
    
    if (newIndex !== currentWeekIndex && newIndex >= 0 && newIndex < weeks.length) {
      setCurrentWeekIndex(newIndex);
      
      // Load more weeks when approaching the end
      if (newIndex > weeks.length - 5) {
        const newWeeks = [...weeks, ...generateWeeks(initialWeekIndex + newIndex + 1)];
        setWeeks(newWeeks);
      } else if (newIndex < 5) {
        const newWeeks = [...generateWeeks(initialWeekIndex - (10 - newIndex)), ...weeks];
        setWeeks(newWeeks);
        // Adjust the scroll position after adding new items
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: newIndex + (10 - newIndex),
            animated: false
          });
        }, 0);
      }
    }
  }, [weeks, currentWeekIndex, initialWeekIndex, generateWeeks]);

  // format week range for header
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

  // check if date is today
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

  // Make sure the FlatList starts at the middle index
  useEffect(() => {
    if (flatListRef.current) {
      const timeout = setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: 10, // Middle index
          animated: false
        });
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  // Handle out-of-bounds scroll indices
  const onScrollToIndexFailed = useCallback((info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ 
        index: info.index, 
        animated: false 
      });
    });
  }, []);

  // Calculate day width based on screen width
  const getDayWidth = useCallback(() => {
    const containerPadding = 16 * 2; // Left and right padding
    const availableWidth = screenWidth - containerPadding;
    return Math.floor(availableWidth / 7); // Divide by 7 days
  }, [screenWidth]);

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
          initialScrollIndex={10}
          keyExtractor={(item, index) => `week-${index}`}
          renderItem={({ item: weekDates }) => (
            <View style={[styles.weekContainer, { width: screenWidth - 32 }]}>
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
                      {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                    </Text>
                    <Text 
                      style={[
                        styles.dayNumber,
                        isToday(date) && styles.todayText,
                        isSelected(date) && styles.selectedText
                      ]}
                      numberOfLines={1}
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
            length: screenWidth - 32,
            offset: (screenWidth - 32) * index,
            index,
          })}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />

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
    paddingTop: 60, 
    marginTop: 10,
  },
  weekHeader: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4D7D',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    alignItems: 'center',
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4D7D',
    textAlign: 'center',
  },
});

export default CalendarView;