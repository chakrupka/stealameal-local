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
  ScrollView
} from 'react-native';

const CalendarView = ({navigation}) => {
  const [currentDate] = useState(new Date());
  const flatListRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const screenWidth = Dimensions.get('window').width;
  
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

  // generate array of week arrays 
  const generateWeeks = useCallback(() => {
    const weeks = [];
    
    const prevWeekDate = new Date(currentDate);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    weeks.push(getWeekDates(prevWeekDate));
    
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
  const [currentWeekIndex, setCurrentWeekIndex] = useState(1); // start with current week

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

  // handle flatList scroll for weeks
  const handleScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(contentOffsetX / viewSize);
    
    if (newIndex !== currentWeekIndex) {
      setCurrentWeekIndex(newIndex);
      
      // add more weeks if needed
      if (newIndex === weeks.length - 1) {
        // add next week
        const lastWeek = weeks[weeks.length - 1];
        const nextWeekStart = new Date(lastWeek[6]);
        nextWeekStart.setDate(nextWeekStart.getDate() + 1);
        const nextWeek = getWeekDates(nextWeekStart);
        setWeeks([...weeks, nextWeek]);
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
          index: 1, // current week index
          animated: false
        });
      }, 100);
    }
  }, []);

  // handle scroll failures
  const onScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: 1,
          animated: false
        });
      }
    }, 100);
  }, []);

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
        </View>

        {/* day labels */}
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={weeks}
          initialScrollIndex={1}
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
        />
        
        {/* time slots and schedule grid */}
        <ScrollView style={styles.scheduleContainer}>
          {timeSlots.map((slot, index) => (
            <View key={`time-${index}`} style={styles.timeSlotRow}>
              {/* time label */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{slot.time}</Text>
              </View>
              
              {/* day columns */}
              <View style={styles.dayColumnsContainer}>
                {Array(7).fill(0).map((_, dayIndex) => (
                  <View 
                    key={`slot-${index}-day-${dayIndex}`} 
                    style={[
                      styles.scheduleSlot,
                      { width: getDayWidth() }
                    ]}
                  />
                ))}
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  }
});

export default CalendarView;