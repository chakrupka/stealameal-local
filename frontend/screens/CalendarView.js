import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TopNav from '../components/TopNav';


const CalendarView = ({navigation }) => {
  return (
    <View style={styles.container}>
        <TopNav navigation={navigation} title="Your Calendar 📅" />
        <View style={styles.contentContainer}>
            <Text style={styles.helloText}>Hello Calendar View! 📅</Text>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
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