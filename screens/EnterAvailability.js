import React, { useState } from "react";
import { View, Button, Text } from "react-native";
import styles from "../styles"; 
import TopNav from "../components/TopNav";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EnterAvailability({ navigation, route }) {
  
  const profilePic = route.params?.profilePic || null;
  const [date, setDate] = useState(new Date()); 
  const [show, setShow] = useState(false); 
  const [mode, setMode] = useState('date');
   
  const onChange = (e, selectedDate) => {
    setDate(selectedDate); 
    setShow(false);
  };

  const showMode = (modeToShow) => {
    setShow(true);
    setMode(modeToShow); 
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Select Availability" profilePic={profilePic}/>
      <View style={styles.content}>
      <Button
       mode="contained"
       style={styles.button}
       title="Select Time Availability" 
       onPress={() => showMode('time')} />
      </View>
    </View>
  );
}
