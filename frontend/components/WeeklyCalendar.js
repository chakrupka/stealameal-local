import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import styles from "../styles";

// Displays a weekly calendar with color-coded activities
const WeeklyCalendar = ({ classes, sporting, extracurricular, other }) => {
  // Colors for each category
  const categoryColors = {
    classes: "#4285F4", // Blue
    sporting: "#EA4335", // Red
    extracurricular: "#FBBC05", // Yellow
    other: "#34A853", // Green
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate time slots from 7 AM to 10 PM
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    if (hour === 12) return `${hour} PM`;
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  });

  const timeToPosition = (time) => {
    if (!time) return 0;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return hours - 7 + minutes / 60;
  };

  // Associate each activity with a category flag
  const allActivities = [
    ...classes.map((item) => ({ ...item, category: "classes" })),
    ...sporting.map((item) => ({ ...item, category: "sporting" })),
    ...extracurricular.map((item) => ({
      ...item,
      category: "extracurricular",
    })),
    ...other.map((item) => ({ ...item, category: "other" })),
  ];

  // Assign each activity to specific days -- idea for making 10,11,12 vs 10A,2A classes
  const activitiesWithDays = allActivities.map((activity, index) => {
    const days = index % 2 === 0 ? [2, 4, 6] : [3, 5];
    return { ...activity, days };
  });

  // Render events on the calendar
  const renderEvents = () => {
    return activitiesWithDays.map((activity, activityIndex) => {
      if (!activity.startTime || !activity.endTime || !activity.name)
        return null;
      const startPos = timeToPosition(activity.startTime);
      const endPos = timeToPosition(activity.endTime);
      const height = (endPos - startPos) * 60;
      if (height <= 0) return null;
      return activity.days.map((day) => (
        <View
          key={`${activityIndex}-${day}`}
          style={[
            localStyles.event,
            {
              backgroundColor: categoryColors[activity.category],
              top: startPos * 60 + 30,
              height: height,
              left: day * 14.28 + 1 + "%",
              width: "13.28%",
              opacity: 0.8,
            },
          ]}
        >
          <Text style={localStyles.eventText}>{activity.name}</Text>
          <Text style={localStyles.eventTime}>
            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
          </Text>
        </View>
      ));
    });
  };

  // format time - can probs just make this global
  const formatTime = (date) => {
    if (!date) return "";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours12}:${minStr} ${ampm}`;
  };

  return (
    <View style={localStyles.container}>
      {/* Legend */}
      <View style={localStyles.legend}>
        <Text style={[localStyles.legendTitle, styles.subheader]}>
          Activities:
        </Text>
        {Object.entries(categoryColors).map(([category, color]) => (
          <View key={category} style={localStyles.legendItem}>
            <View style={[localStyles.colorBox, { backgroundColor: color }]} />
            <Text style={localStyles.legendText}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Header */}
      <View style={localStyles.header}>
        <View style={localStyles.timeColumn}>
          <Text style={localStyles.headerText}>Time</Text>
        </View>
        {daysOfWeek.map((day) => (
          <View key={day} style={localStyles.dayColumn}>
            <Text style={localStyles.headerText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Body */}
      <ScrollView style={localStyles.calendarBody}>
        <View style={localStyles.timeSlotContainer}>
          {timeSlots.map((time) => (
            <View key={time} style={localStyles.timeSlot}>
              <Text style={localStyles.timeText}>{time}</Text>
              <View style={localStyles.timeSlotRow} />
            </View>
          ))}
          {renderEvents()}
        </View>
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
    marginBottom: 30,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  legendTitle: {
    fontWeight: "bold",
    marginRight: 10,
    fontSize: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginVertical: 2,
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 5,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  timeColumn: {
    width: "12%",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  dayColumn: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  calendarBody: {
    flex: 1,
    height: 500,
  },
  timeSlotContainer: {
    position: "relative",
    paddingBottom: 20,
  },
  timeSlot: {
    flexDirection: "row",
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  timeText: {
    width: "12%",
    fontSize: 10,
    textAlign: "center",
    paddingTop: 5,
    color: "#666",
  },
  timeSlotRow: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  event: {
    position: "absolute",
    borderRadius: 4,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  eventText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  eventTime: {
    color: "white",
    fontSize: 8,
  },
});

export default WeeklyCalendar;
