import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CalendarView = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.helloText}>Hello Calendar View! 📅</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  helloText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C4D7D', // Matching your app's purple theme
  },
});

export default CalendarView;