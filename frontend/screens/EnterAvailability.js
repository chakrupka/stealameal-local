import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, List } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import TopNav from '../components/TopNav';
import WeeklyCalendar from '../components/WeeklyCalendar';

function formatTime(date) {
  if (!date) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours12}:${minStr} ${ampm}`;
}

export default function EnterAvailability({ navigation, route }) {
  const [classes, setClasses] = useState([]);
  const [sporting, setSporting] = useState([]);
  const [extracurricular, setExtracurricular] = useState([]);
  const [other, setOther] = useState([]);

  // State for calendar toggle
  const [showCalendar, setShowCalendar] = useState(false);

  // DateTimePicker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [pickerCategory, setPickerCategory] = useState(null);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [whichTime, setWhichTime] = useState('start'); // indicates whether we're picking the "start" or "end" time

  // Collapsible states for each category
  const [expandedClasses, setExpandedClasses] = useState(true);
  const [expandedSporting, setExpandedSporting] = useState(false);
  const [expandedExtra, setExpandedExtra] = useState(false);
  const [expandedOther, setExpandedOther] = useState(false);

  // Time picker for a specific category & index, specifying start/end
  const openTimePicker = (category, index, currentTime, timeType) => {
    setPickerCategory(category);
    setPickerIndex(index);
    setWhichTime(timeType); // "start" or "end"
    setPickerValue(currentTime || new Date());
    setShowPicker(true);
  };

  // When user selects time
  const onTimeChange = (event, selectedTime) => {
    const time = selectedTime || pickerValue;
    setShowPicker(false);

    // Update the correct array item
    const updateArrayItem = (arraySetter) => {
      arraySetter((prev) =>
        prev.map((item, idx) => {
          if (idx !== pickerIndex) return item;
          if (whichTime === 'start') {
            return { ...item, startTime: time };
          } else {
            return { ...item, endTime: time };
          }
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
  };

  // Add a new shcedule item in a category
  const addItem = (category) => {
    const newItem = { name: '', startTime: null, endTime: null };
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

  // Update the name of an item in a category
  // tbh idk if we need this, i had to chatgpt this
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

  // need to fix for our backend but im just keeping this here so we can make it look good
  const handleSave = () => {
    console.log('Classes: ', classes);
    console.log('Sporting: ', sporting);
    console.log('Extracurricular: ', extracurricular);
    console.log('Other: ', other);
    alert('Schedule saved!');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Nav */}
      <TopNav navigation={navigation} title="Input Your Schedule" />

      {/* Scrollable content */}
      <ScrollView
        style={[
          stylesLocal.content,
          { paddingTop: 130, paddingLeft: 20, paddingRight: 5 },
        ]}
      >
        {/* Header text */}
        <Text style={stylesLocal.header}>Input Your Schedule</Text>

        {/* CLASSES */}
        <List.Accordion
          title="Classes"
          expanded={expandedClasses}
          onPress={() => setExpandedClasses(!expandedClasses)}
          left={(props) => <List.Icon {...props} icon="book-outline" />}
        >
          {classes.map((item, index) => (
            <View key={index} style={stylesLocal.itemContainer}>
              <TextInput
                label="Class Name"
                value={item.name}
                onChangeText={(text) => updateItemName('classes', index, text)}
                style={stylesLocal.input}
              />
              {/* START TIME BUTTON */}
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('classes', index, item.startTime, 'start')
                }
                style={{ marginRight: 8 }}
              >
                {item.startTime
                  ? `Start: ${formatTime(item.startTime)}`
                  : 'Start Time'}
              </Button>
              {/* END TIME BUTTON */}
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('classes', index, item.endTime, 'end')
                }
                style={{ marginRight: 8 }}
              >
                {item.endTime ? `End: ${formatTime(item.endTime)}` : 'End Time'}
              </Button>
            </View>
          ))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('classes')}
            style={stylesLocal.addButton}
          >
            Add Class
          </Button>
        </List.Accordion>

        {/* SPORTING */}
        <List.Accordion
          title="Sporting"
          expanded={expandedSporting}
          onPress={() => setExpandedSporting(!expandedSporting)}
          left={(props) => <List.Icon {...props} icon="basketball" />}
        >
          {sporting.map((item, index) => (
            <View key={index} style={stylesLocal.itemContainer}>
              <TextInput
                label="Sport Name"
                value={item.name}
                onChangeText={(text) => updateItemName('sporting', index, text)}
                style={stylesLocal.input}
              />
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('sporting', index, item.startTime, 'start')
                }
                style={{ marginRight: 8 }}
              >
                {item.startTime
                  ? `Start: ${formatTime(item.startTime)}`
                  : 'Start Time'}
              </Button>
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('sporting', index, item.endTime, 'end')
                }
                style={{ marginRight: 8 }}
              >
                {item.endTime ? `End: ${formatTime(item.endTime)}` : 'End Time'}
              </Button>
            </View>
          ))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('sporting')}
            style={stylesLocal.addButton}
          >
            Add Sport
          </Button>
        </List.Accordion>

        {/* EXTRACURRICULAR */}
        <List.Accordion
          title="Extracurricular"
          expanded={expandedExtra}
          onPress={() => setExpandedExtra(!expandedExtra)}
          left={(props) => <List.Icon {...props} icon="guitar-acoustic" />}
        >
          {extracurricular.map((item, index) => (
            <View key={index} style={stylesLocal.itemContainer}>
              <TextInput
                label="Activity Name"
                value={item.name}
                onChangeText={(text) =>
                  updateItemName('extracurricular', index, text)
                }
                style={stylesLocal.input}
              />
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker(
                    'extracurricular',
                    index,
                    item.startTime,
                    'start',
                  )
                }
                style={{ marginRight: 8 }}
              >
                {item.startTime
                  ? `Start: ${formatTime(item.startTime)}`
                  : 'Start Time'}
              </Button>
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('extracurricular', index, item.endTime, 'end')
                }
                style={{ marginRight: 8 }}
              >
                {item.endTime ? `End: ${formatTime(item.endTime)}` : 'End Time'}
              </Button>
            </View>
          ))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('extracurricular')}
            style={stylesLocal.addButton}
          >
            Add Activity
          </Button>
        </List.Accordion>

        {/* OTHER */}
        <List.Accordion
          title="Other"
          expanded={expandedOther}
          onPress={() => setExpandedOther(!expandedOther)}
          left={(props) => <List.Icon {...props} icon="dots-horizontal" />}
        >
          {other.map((item, index) => (
            <View key={index} style={stylesLocal.itemContainer}>
              <TextInput
                label="Other Name"
                value={item.name}
                onChangeText={(text) => updateItemName('other', index, text)}
                style={stylesLocal.input}
              />
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('other', index, item.startTime, 'start')
                }
                style={{ marginRight: 8 }}
              >
                {item.startTime
                  ? `Start: ${formatTime(item.startTime)}`
                  : 'Start Time'}
              </Button>
              <Button
                mode="outlined"
                onPress={() =>
                  openTimePicker('other', index, item.endTime, 'end')
                }
                style={{ marginRight: 8 }}
              >
                {item.endTime ? `End: ${formatTime(item.endTime)}` : 'End Time'}
              </Button>
            </View>
          ))}

          <Button
            icon="plus"
            mode="contained"
            onPress={() => addItem('other')}
            style={stylesLocal.addButton}
          >
            Add Other
          </Button>
        </List.Accordion>

        {/* Calendar View Toggle Button */}
        <Button
          mode="contained"
          onPress={() => setShowCalendar(!showCalendar)}
          style={{ marginVertical: 12 }}
        >
          {showCalendar ? 'Hide Calendar View' : 'Show Calendar View'}
        </Button>

        {/* Calendar View */}
        {showCalendar && (
          <View style={{ height: 600, marginTop: 20 }}>
            <WeeklyCalendar
              classes={classes}
              sporting={sporting}
              extracurricular={extracurricular}
              other={other}
            />
          </View>
        )}

        {/* SAVE BUTTON */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={{ marginVertical: 24 }}
        >
          Save Schedule
        </Button>
      </ScrollView>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

// Using local styles because my styles.js is NOT working can someone help
const stylesLocal = StyleSheet.create({
  header: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    margin: 16,
    alignSelf: 'center',
  },
});
