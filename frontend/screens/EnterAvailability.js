import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  List,
  Chip,
  IconButton,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import TopNav from '../components/TopNav';
import styles from '../styles';
import { MaterialIcons } from '@expo/vector-icons';
import useStore from '../store';
import {
  updateAvailability,
  getAvailability,
} from '../services/availability-api';

const TIME_BLOCKS = {
  '8S': {
    schedule: 'MTuWThF 7:45-8:35am',
    days: ['M', 'Tu', 'W', 'Th', 'F'],
    startTime: '7:45 AM',
    endTime: '8:35 AM',
  },
  '8L': {
    schedule: 'MWF 7:30-8:35am',
    days: ['M', 'W', 'F'],
    startTime: '7:30 AM',
    endTime: '8:35 AM',
  },
  '9S': {
    schedule: 'MTuWThF 9:05-9:55am',
    days: ['M', 'Tu', 'W', 'Th', 'F'],
    startTime: '9:05 AM',
    endTime: '9:55 AM',
  },
  '9L': {
    schedule: 'MWF 8:50-9:55am',
    days: ['M', 'W', 'F'],
    startTime: '8:50 AM',
    endTime: '9:55 AM',
  },
  10: {
    schedule: 'MWF 10:10-11:15am',
    days: ['M', 'W', 'F'],
    startTime: '10:10 AM',
    endTime: '11:15 AM',
  },
  '10A': {
    schedule: 'TuTh 10:10am-12:00pm',
    days: ['Tu', 'Th'],
    startTime: '10:10 AM',
    endTime: '12:00 PM',
  },
  11: {
    schedule: 'MWF 11:30am-12:35pm',
    days: ['M', 'W', 'F'],
    startTime: '11:30 AM',
    endTime: '12:35 PM',
  },
  12: {
    schedule: 'MWF 12:50-1:55pm',
    days: ['M', 'W', 'F'],
    startTime: '12:50 PM',
    endTime: '1:55 PM',
  },
  2: {
    schedule: 'MWF 2:10-3:15pm',
    days: ['M', 'W', 'F'],
    startTime: '2:10 PM',
    endTime: '3:15 PM',
  },
  '2A': {
    schedule: 'TuTh 2:25-4:15pm',
    days: ['Tu', 'Th'],
    startTime: '2:25 PM',
    endTime: '4:15 PM',
  },
  '3A': {
    schedule: 'MW 3:30-5:20pm',
    days: ['M', 'W'],
    startTime: '3:30 PM',
    endTime: '5:20 PM',
  },
  '3B': {
    schedule: 'TuTh 4:30-6:20pm',
    days: ['Tu', 'Th'],
    startTime: '4:30 PM',
    endTime: '6:20 PM',
  },
  '6A': {
    schedule: 'MTh 6:30-8:20pm',
    days: ['M', 'Th'],
    startTime: '6:30 PM',
    endTime: '8:20 PM',
  },
  '6B': {
    schedule: 'W 6:30-9:30pm',
    days: ['W'],
    startTime: '6:30 PM',
    endTime: '9:30 PM',
  },
};

const DAYS_OF_WEEK = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

function formatTime(date) {
  if (!date) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours12}:${minStr} ${ampm}`;
}

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString();
}

function timeStringToDate(timeStr) {
  if (!timeStr) return null;
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  const date = new Date();
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  date.setHours(hour);
  date.setMinutes(parseInt(minutes));
  date.setSeconds(0);
  return date;
}

export default function EnterAvailability({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [classes, setClasses] = useState([]);
  const [sporting, setSporting] = useState([]);
  const [extracurricular, setExtracurricular] = useState([]);
  const [other, setOther] = useState([]);
  const [currentClassIndex, setCurrentClassIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const currentUser = useStore((state) => state.userSlice.currentUser);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [pickerCategory, setPickerCategory] = useState(null);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [whichTime, setWhichTime] = useState('start');
  const [pickerType, setPickerType] = useState('time');

  const [expandedClasses, setExpandedClasses] = useState(false);
  const [expandedSporting, setExpandedSporting] = useState(false);
  const [expandedExtra, setExpandedExtra] = useState(false);
  const [expandedOther, setExpandedOther] = useState(false);

  const [showTimeBlocks, setShowTimeBlocks] = useState(false);

  const [tempPickerValue, setTempPickerValue] = useState(new Date());
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const [minimizedItems, setMinimizedItems] = useState({
    classes: [],
    sporting: [],
    extracurricular: [],
    other: [],
  });

  useEffect(() => {
    loadExistingAvailability();
  }, [currentUser]);

  const loadExistingAvailability = async () => {
    if (!currentUser?.idToken) return;

    try {
      setInitialLoad(true);
      const response = await getAvailability(currentUser.idToken);

      if (response.availability) {
        const { availability } = response;
        setClasses(availability.classes || []);
        setSporting(availability.sporting || []);
        setExtracurricular(availability.extracurricular || []);
        setOther(availability.other || []);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'Failed to load your existing schedule');
    } finally {
      setInitialLoad(false);
    }
  };

  // Helper function to validate time order
  const validateTimeOrder = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    return startTime < endTime;
  };

  // Helper function to show time validation warning
  const showTimeValidationWarning = (callback) => {
    Alert.alert(
      'Invalid Time Range',
      'The end time cannot be before the start time. The end time will be automatically adjusted to match the start time.',
      [
        {
          text: 'OK',
          onPress: callback,
        },
      ],
    );
  };

  const toggleMinimized = (category, index) => {
    setMinimizedItems((prev) => {
      const categoryItems = [...prev[category]];
      const itemIndex = categoryItems.indexOf(index);

      if (itemIndex > -1) {
        categoryItems.splice(itemIndex, 1);
      } else {
        categoryItems.push(index);
      }

      return {
        ...prev,
        [category]: categoryItems,
      };
    });
  };

  const openTimePicker = (category, index, currentTime, timeType) => {
    setPickerCategory(category);
    setPickerIndex(index);
    setWhichTime(timeType);
    const initialTime = currentTime || new Date();
    setPickerValue(initialTime);
    setTempPickerValue(initialTime);
    setShowPicker(true);
    setPickerType('time');
    setPickerModalVisible(true);
  };

  const openDatePicker = (category, index, currentDate, dateType) => {
    setPickerCategory(category);
    setPickerIndex(index);
    setWhichTime(dateType);
    const initialDate = currentDate || new Date();
    setPickerValue(initialDate);
    setTempPickerValue(initialDate);
    setShowPicker(true);
    setPickerType('date');
    setPickerModalVisible(true);
  };

  const handlePickerDone = () => {
    setPickerModalVisible(false);
    setShowPicker(false);

    if (pickerType === 'time') {
      const updateArrayItem = (arraySetter) => {
        arraySetter((prev) =>
          prev.map((item, idx) => {
            if (idx !== pickerIndex) return item;

            let updatedItem = { ...item };

            if (whichTime === 'start') {
              updatedItem.startTime = tempPickerValue;

              // If end time exists and is now before or equal to start time, push it forward
              if (
                updatedItem.endTime &&
                tempPickerValue >= updatedItem.endTime
              ) {
                const newEndTime = new Date(tempPickerValue);
                newEndTime.setHours(newEndTime.getHours() + 1); // Add 1 hour
                updatedItem.endTime = newEndTime;

                showTimeValidationWarning(() => {
                  console.log(
                    'End time automatically pushed forward to maintain valid time range',
                  );
                });
              }
            } else {
              // Setting end time
              if (
                updatedItem.startTime &&
                tempPickerValue <= updatedItem.startTime
              ) {
                // End time is before or equal to start time - push it forward
                const newEndTime = new Date(updatedItem.startTime);
                newEndTime.setMinutes(newEndTime.getMinutes() + 30); // Add 30 minutes minimum
                updatedItem.endTime = newEndTime;

                showTimeValidationWarning(() => {
                  console.log(
                    'End time automatically pushed forward to be after start time',
                  );
                });
              } else {
                updatedItem.endTime = tempPickerValue;
              }
            }

            return updatedItem;
          }),
        );
      };

      switch (pickerCategory) {
        case 'classes':
          updateArrayItem(setClasses);
          break;
        case 'sporting':
          updateArrayItem(setSporting);
          break;
        case 'extracurricular':
          updateArrayItem(setExtracurricular);
          break;
        case 'other':
          updateArrayItem(setOther);
          break;
        default:
          break;
      }
    } else if (pickerType === 'date') {
      const updateArrayItem = (arraySetter) => {
        arraySetter((prev) =>
          prev.map((item, idx) => {
            if (idx !== pickerIndex) return item;
            if (whichTime === 'startDate') {
              return { ...item, startDate: tempPickerValue };
            } else if (whichTime === 'endDate') {
              return { ...item, endDate: tempPickerValue };
            } else if (whichTime === 'specificDate') {
              return { ...item, specificDate: tempPickerValue };
            }
            return item;
          }),
        );
      };

      switch (pickerCategory) {
        case 'classes':
          updateArrayItem(setClasses);
          break;
        case 'sporting':
          updateArrayItem(setSporting);
          break;
        case 'extracurricular':
          updateArrayItem(setExtracurricular);
          break;
        case 'other':
          updateArrayItem(setOther);
          break;
        default:
          break;
      }
    }
  };

  const handlePickerCancel = () => {
    setPickerModalVisible(false);
    setShowPicker(false);
  };

  const onPickerChange = (event, selectedValue) => {
    if (selectedValue) {
      setTempPickerValue(selectedValue);
    }
  };

  const addItem = (category) => {
    const newItem = {
      name: '',
      startTime: null,
      endTime: null,
      days: [],
      startDate: null,
      endDate: null,
      category: category,
    };

    if (category === 'other') {
      newItem.occurrenceType = 'weekly';
      newItem.specificDate = null;
    }

    switch (category) {
      case 'classes':
        setClasses((prev) => [...prev, newItem]);
        break;
      case 'sporting':
        setSporting((prev) => [...prev, newItem]);
        break;
      case 'extracurricular':
        setExtracurricular((prev) => [...prev, newItem]);
        break;
      case 'other':
        setOther((prev) => [...prev, newItem]);
        break;
      default:
        break;
    }
  };

  const deleteItem = (category, index) => {
    switch (category) {
      case 'classes':
        setClasses((prev) => prev.filter((_, idx) => idx !== index));
        break;
      case 'sporting':
        setSporting((prev) => prev.filter((_, idx) => idx !== index));
        break;
      case 'extracurricular':
        setExtracurricular((prev) => prev.filter((_, idx) => idx !== index));
        break;
      case 'other':
        setOther((prev) => prev.filter((_, idx) => idx !== index));
        break;
      default:
        break;
    }

    setMinimizedItems((prev) => {
      const categoryItems = prev[category].filter(
        (itemIndex) => itemIndex !== index,
      );
      const adjustedItems = categoryItems.map((itemIndex) =>
        itemIndex > index ? itemIndex - 1 : itemIndex,
      );

      return {
        ...prev,
        [category]: adjustedItems,
      };
    });
  };

  const updateItemName = (category, index, newName) => {
    const updateArray = (setter) => {
      setter((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, name: newName } : item,
        ),
      );
    };
    switch (category) {
      case 'classes':
        updateArray(setClasses);
        break;
      case 'sporting':
        updateArray(setSporting);
        break;
      case 'extracurricular':
        updateArray(setExtracurricular);
        break;
      case 'other':
        updateArray(setOther);
        break;
      default:
        break;
    }
  };

  const updateOccurrenceType = (index, type) => {
    setOther((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, occurrenceType: type } : item,
      ),
    );
  };

  const toggleDay = (category, index, day) => {
    const updateArray = (setter) => {
      setter((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          const newDays = item.days.includes(day)
            ? item.days.filter((d) => d !== day)
            : [...item.days, day];
          return { ...item, days: newDays };
        }),
      );
    };

    switch (category) {
      case 'sporting':
        updateArray(setSporting);
        break;
      case 'extracurricular':
        updateArray(setExtracurricular);
        break;
      case 'other':
        updateArray(setOther);
        break;
      default:
        break;
    }
  };

  const openTimeBlockSelector = (index) => {
    setCurrentClassIndex(index);
    setShowTimeBlocks(true);
  };

  const applyTimeBlock = (blockKey) => {
    const block = TIME_BLOCKS[blockKey];
    if (!block || currentClassIndex === null) return;

    const startDate = timeStringToDate(block.startTime);
    const endDate = timeStringToDate(block.endTime);

    setClasses((prev) =>
      prev.map((item, idx) => {
        if (idx !== currentClassIndex) return item;
        return {
          ...item,
          startTime: startDate,
          endTime: endDate,
          timeBlock: blockKey,
          schedule: block.schedule,
          days: block.days,
        };
      }),
    );

    setShowTimeBlocks(false);
  };

  const handleSave = async () => {
    if (!currentUser?.idToken) {
      Alert.alert('Error', 'Please log in to save your availability');
      return;
    }

    try {
      setLoading(true);

      const availabilityData = {
        classes,
        sporting,
        extracurricular,
        other,
      };

      console.log('Saving availability:', availabilityData);

      await updateAvailability(currentUser.idToken, availabilityData);

      Alert.alert('Success', 'Your availability has been saved!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('CalendarView', {
              classes,
              sporting,
              extracurricular,
              other,
            }),
        },
      ]);
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert(
        'Error',
        'Failed to save your availability. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderDaySelectors = (category, index, item) => {
    if (category === 'classes') return null;

    if (category === 'other' && item.occurrenceType === 'specific') {
      return null;
    }

    return (
      <View style={stylesLocal.daySelectorContainer}>
        <Text style={stylesLocal.sectionLabel}>Select Days:</Text>
        <View style={stylesLocal.daysRow}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                stylesLocal.daySelector,
                item.days?.includes(day) && stylesLocal.daySelected,
              ]}
              onPress={() => toggleDay(category, index, day)}
            >
              <Text
                style={[
                  stylesLocal.dayText,
                  item.days?.includes(day) && stylesLocal.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDateButtons = (category, index, item) => {
    if (category === 'other' && item.occurrenceType === 'specific') {
      return (
        <View style={stylesLocal.dateButtonsContainer}>
          <Text style={stylesLocal.sectionLabel}>Select Date:</Text>
          <Button
            mode="outlined"
            onPress={() =>
              openDatePicker(category, index, item.specificDate, 'specificDate')
            }
            style={{ flex: 1, marginBottom: 8 }}
          >
            {item.specificDate
              ? `Date: ${formatDate(item.specificDate)}`
              : 'Select Date'}
          </Button>
        </View>
      );
    }

    return (
      <View style={stylesLocal.dateButtonsContainer}>
        <Text style={stylesLocal.sectionLabel}>Date Range:</Text>
        <View style={stylesLocal.dateButtonsRow}>
          <Button
            mode="outlined"
            onPress={() =>
              openDatePicker(category, index, item.startDate, 'startDate')
            }
            style={{ marginRight: 8, marginBottom: 8, flex: 1 }}
          >
            {item.startDate
              ? `Start: ${formatDate(item.startDate)}`
              : 'Start Date'}
          </Button>
          <Button
            mode="outlined"
            onPress={() =>
              openDatePicker(category, index, item.endDate, 'endDate')
            }
            style={{ marginBottom: 8, flex: 1 }}
          >
            {item.endDate ? `End: ${formatDate(item.endDate)}` : 'End Date'}
          </Button>
        </View>
      </View>
    );
  };

  const renderTimeButtons = (category, index, item) => {
    if (category === 'classes') return null;

    // Check if times are valid and show warning if not
    const hasInvalidTimeOrder =
      item.startTime &&
      item.endTime &&
      !validateTimeOrder(item.startTime, item.endTime);

    return (
      <View style={stylesLocal.timeButtonsContainer}>
        <Text style={stylesLocal.sectionLabel}>Time Range:</Text>
        {hasInvalidTimeOrder && (
          <Text style={stylesLocal.timeWarning}>
            ⚠️ End time should be after start time
          </Text>
        )}
        <View style={stylesLocal.timeButtonsRow}>
          <Button
            mode="outlined"
            onPress={() =>
              openTimePicker(category, index, item.startTime, 'start')
            }
            style={{ marginRight: 8, marginBottom: 8, flex: 1 }}
          >
            {item.startTime
              ? `Start: ${formatTime(item.startTime)}`
              : 'Start Time'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => openTimePicker(category, index, item.endTime, 'end')}
            style={{ marginBottom: 8, flex: 1 }}
          >
            {item.endTime ? `End: ${formatTime(item.endTime)}` : 'End Time'}
          </Button>
        </View>
      </View>
    );
  };

  const renderOccurrenceTypeSelector = (item, index) => {
    return (
      <View style={stylesLocal.occurrenceTypeContainer}>
        <Text style={stylesLocal.occurrenceTypeLabel}>Occurrence Type:</Text>
        <View style={stylesLocal.radioButtonContainer}>
          <View style={stylesLocal.radioOption}>
            <RadioButton
              value="weekly"
              status={
                item.occurrenceType === 'weekly' ? 'checked' : 'unchecked'
              }
              onPress={() => updateOccurrenceType(index, 'weekly')}
            />
            <Text onPress={() => updateOccurrenceType(index, 'weekly')}>
              Weekly
            </Text>
          </View>
          <View style={stylesLocal.radioOption}>
            <RadioButton
              value="specific"
              status={
                item.occurrenceType === 'specific' ? 'checked' : 'unchecked'
              }
              onPress={() => updateOccurrenceType(index, 'specific')}
            />
            <Text onPress={() => updateOccurrenceType(index, 'specific')}>
              Specific Day
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = (item, index, category) => {
    const isMinimized = minimizedItems[category].includes(index);

    if (isMinimized) {
      const categoryText = {
        classes: stylesLocal.classText,
        sporting: stylesLocal.sportingText,
        extracurricular: stylesLocal.extracurricularText,
        other: stylesLocal.otherText,
      }[category];

      const categoryLabel = {
        classes: 'Class',
        sporting: 'Sport',
        extracurricular: 'Extracurricular',
        other: 'Other',
      }[category];

      return (
        <View key={index} style={stylesLocal.card}>
          <View style={stylesLocal.cardHeader}>
            <Text style={stylesLocal.cardTitle}>
              {item.name || `Unnamed ${categoryLabel}`}
            </Text>
            <View style={stylesLocal.cardActions}>
              <TouchableOpacity
                onPress={() => toggleMinimized(category, index)}
              >
                <MaterialIcons name="edit" size={20} color="#6750a4" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteItem(category, index)}
                style={{ marginLeft: 10 }}
              >
                <MaterialIcons
                  name="cancel"
                  size={20}
                  color="rgb(255, 99, 99)"
                  style={stylesLocal.trashIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={stylesLocal.divider} />

          <View style={stylesLocal.infoRow}>
            <Text style={stylesLocal.label}>Type:</Text>
            <Text style={[stylesLocal.value, categoryText]}>
              {categoryLabel}
            </Text>
          </View>

          {category === 'classes' && item.timeBlock && (
            <View style={stylesLocal.infoRow}>
              <Text style={stylesLocal.label}>Time Block:</Text>
              <Text style={stylesLocal.value}>{item.timeBlock}</Text>
            </View>
          )}

          {item.days && item.days.length > 0 && (
            <View style={stylesLocal.infoRow}>
              <Text style={stylesLocal.label}>Days:</Text>
              <Text style={stylesLocal.value}>{item.days.join(', ')}</Text>
            </View>
          )}

          {item.startTime && (
            <View style={stylesLocal.infoRow}>
              <Text style={stylesLocal.label}>Start Time:</Text>
              <Text style={stylesLocal.value}>
                {formatTime(item.startTime)}
              </Text>
            </View>
          )}

          {item.endTime && (
            <View style={stylesLocal.infoRow}>
              <Text style={stylesLocal.label}>End Time:</Text>
              <Text style={stylesLocal.value}>{formatTime(item.endTime)}</Text>
            </View>
          )}

          {category === 'other' && item.occurrenceType && (
            <View style={stylesLocal.infoRow}>
              <Text style={stylesLocal.label}>Occurrence:</Text>
              <Text style={stylesLocal.value}>
                {item.occurrenceType === 'weekly' ? 'Weekly' : 'Specific Day'}
              </Text>
            </View>
          )}

          {category === 'other' &&
            item.occurrenceType === 'specific' &&
            item.specificDate && (
              <View style={stylesLocal.infoRow}>
                <Text style={stylesLocal.label}>Date:</Text>
                <Text style={stylesLocal.value}>
                  {formatDate(item.specificDate)}
                </Text>
              </View>
            )}

          {(category !== 'other' || item.occurrenceType === 'weekly') && (
            <>
              {item.startDate && (
                <View style={stylesLocal.infoRow}>
                  <Text style={stylesLocal.label}>Start Date:</Text>
                  <Text style={stylesLocal.value}>
                    {formatDate(item.startDate)}
                  </Text>
                </View>
              )}

              {item.endDate && (
                <View style={stylesLocal.infoRow}>
                  <Text style={stylesLocal.label}>End Date:</Text>
                  <Text style={stylesLocal.value}>
                    {formatDate(item.endDate)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      );
    }

    return (
      <View key={index} style={stylesLocal.itemOuterContainer}>
        <View style={stylesLocal.itemHeader}>
          <IconButton
            icon="check"
            size={20}
            onPress={() => toggleMinimized(category, index)}
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteItem(category, index)}
          />
        </View>

        <View style={stylesLocal.itemContainer}>
          <TextInput
            label={
              category === 'classes'
                ? 'Class Name'
                : category === 'sporting'
                ? 'Sport Name'
                : category === 'extracurricular'
                ? 'Activity Name'
                : 'Other Name'
            }
            value={item.name}
            onChangeText={(text) => updateItemName(category, index, text)}
            style={stylesLocal.input}
          />
        </View>

        {category === 'classes' ? (
          <>
            <Button
              mode="contained"
              onPress={() => openTimeBlockSelector(index)}
              style={{ marginHorizontal: 16, marginVertical: 8 }}
            >
              {item.timeBlock ? `${item.timeBlock}` : 'Select Time Block'}
            </Button>

            {renderDateButtons(category, index, item)}
          </>
        ) : (
          <>
            {category === 'other' && renderOccurrenceTypeSelector(item, index)}

            {renderDaySelectors(category, index, item)}

            {renderDateButtons(category, index, item)}

            {renderTimeButtons(category, index, item)}
          </>
        )}
      </View>
    );
  };

  const sortedTimeBlocks = () => {
    const firstBlocks = ['8S', '8L', '9S', '9L'];
    const remainingBlocks = Object.keys(TIME_BLOCKS)
      .filter((key) => !firstBlocks.includes(key))
      .sort();
    return [...firstBlocks, ...remainingBlocks];
  };

  const toggleAccordion = (section) => {
    if (section === 'classes') {
      setExpandedClasses(!expandedClasses);
      setExpandedSporting(false);
      setExpandedExtra(false);
      setExpandedOther(false);
    } else if (section === 'sporting') {
      setExpandedSporting(!expandedSporting);
      setExpandedClasses(false);
      setExpandedExtra(false);
      setExpandedOther(false);
    } else if (section === 'extracurricular') {
      setExpandedExtra(!expandedExtra);
      setExpandedClasses(false);
      setExpandedSporting(false);
      setExpandedOther(false);
    } else if (section === 'other') {
      setExpandedOther(!expandedOther);
      setExpandedClasses(false);
      setExpandedSporting(false);
      setExpandedExtra(false);
    }

    if (showTimeBlocks) setShowTimeBlocks(false);
  };

  if (initialLoad) {
    return (
      <View style={{ flex: 1 }}>
        <TopNav
          navigation={navigation}
          title="Input Your Schedule"
          profilePic={profilePic}
        />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#6750a4" />
          <Text style={{ marginTop: 20 }}>Loading your schedule...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TopNav
        navigation={navigation}
        title="Input Your Schedule"
        profilePic={profilePic}
      />

      <ScrollView
        style={[
          stylesLocal.content,
          { paddingTop: 130, paddingLeft: 20, paddingRight: 5 },
        ]}
      >
        <List.Accordion
          title="Classes"
          expanded={expandedClasses}
          onPress={() => toggleAccordion('classes')}
          left={(props) => <List.Icon {...props} icon="book-outline" />}
        >
          {classes.map((item, index) => renderItem(item, index, 'classes'))}

          {showTimeBlocks && (
            <View style={stylesLocal.timeBlockContainer}>
              <Text style={stylesLocal.timeBlockTitle}>
                Select a Time Block
              </Text>
              <ScrollView style={stylesLocal.timeBlockScroll}>
                <View style={stylesLocal.timeBlockGrid}>
                  {sortedTimeBlocks().map((key) => (
                    <Chip
                      key={key}
                      mode="outlined"
                      onPress={() => applyTimeBlock(key)}
                      style={stylesLocal.timeBlockChip}
                    >
                      {key}: {TIME_BLOCKS[key].schedule}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
              <Button
                mode="outlined"
                onPress={() => setShowTimeBlocks(false)}
                style={stylesLocal.closeButton}
              >
                Close
              </Button>
            </View>
          )}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('classes')}
            style={stylesLocal.addButton}
            contentStyle={stylesLocal.addButtonContent}
          >
            Add Class
          </Button>
        </List.Accordion>

        <List.Accordion
          title="Sporting"
          expanded={expandedSporting}
          onPress={() => toggleAccordion('sporting')}
          left={(props) => <List.Icon {...props} icon="basketball" />}
        >
          {sporting.map((item, index) => renderItem(item, index, 'sporting'))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('sporting')}
            style={stylesLocal.addButton}
            contentStyle={stylesLocal.addButtonContent}
          >
            Add Sport
          </Button>
        </List.Accordion>

        <List.Accordion
          title="Extracurricular"
          expanded={expandedExtra}
          onPress={() => toggleAccordion('extracurricular')}
          left={(props) => <List.Icon {...props} icon="guitar-acoustic" />}
        >
          {extracurricular.map((item, index) =>
            renderItem(item, index, 'extracurricular'),
          )}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('extracurricular')}
            style={stylesLocal.addButton}
            contentStyle={stylesLocal.addButtonContent}
          >
            Add Activity
          </Button>
        </List.Accordion>

        <List.Accordion
          title="Other"
          expanded={expandedOther}
          onPress={() => toggleAccordion('other')}
          left={(props) => <List.Icon {...props} icon="dots-horizontal" />}
        >
          {other.map((item, index) => renderItem(item, index, 'other'))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('other')}
            style={stylesLocal.addButton}
            contentStyle={stylesLocal.addButtonContent}
          >
            Add Other Activity
          </Button>
        </List.Accordion>

        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate('CalendarView', {
              classes,
              sporting,
              extracurricular,
              other,
            })
          }
          style={{ marginVertical: 12 }}
          icon="calendar"
        >
          View Calendar
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={{ marginVertical: 24 }}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </ScrollView>

      <Modal
        visible={pickerModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={stylesLocal.modalOverlay}>
          <View style={stylesLocal.modalContent}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={handlePickerCancel}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {pickerType === 'time' ? 'Select Time' : 'Select Date'}
              </Text>
              <TouchableOpacity onPress={handlePickerDone}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempPickerValue}
                  mode={pickerType}
                  is24Hour={false}
                  display="spinner"
                  onChange={onPickerChange}
                  style={styles.picker}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const stylesLocal = StyleSheet.create({
  header: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  itemOuterContainer: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  itemContainer: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  input: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: 4,
  },
  dateButtonsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButtonsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeWarning: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  daySelectorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  daySelector: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    margin: 1,
  },
  daySelected: {
    backgroundColor: '#5C4D7D',
    borderColor: '#5C4D7D',
  },
  dayText: {
    fontSize: 12,
  },
  dayTextSelected: {
    color: 'white',
  },
  addButton: {
    margin: 16,
  },
  addButtonContent: {
    padding: 8,
  },
  occurrenceTypeContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  occurrenceTypeLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeBlockContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timeBlockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeBlockScroll: {
    maxHeight: 300,
  },
  timeBlockGrid: {
    flexDirection: 'column',
  },
  timeBlockChip: {
    margin: 4,
    height: 44,
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  card: {
    backgroundColor: '#f8f8ff',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '90%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750a4',
    marginBottom: 5,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
    minWidth: 70,
    fontSize: 14,
  },
  value: {
    flex: 1,
    fontSize: 14,
  },
  classText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  sportingText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  extracurricularText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  otherText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
});
