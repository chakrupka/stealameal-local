import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import styles from "../styles"; 
import TopNav from "../components/TopNav";

export default function WhatNow({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="What Now?" profilePic={profilePic} />

      <View style={styles.content}>
        <Text style={styles.title}>Choose an Option</Text>

        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("PingFriends", { profilePic })}>
          Ping Friends Now
        </Button>
        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("ScheduleMeal", { profilePic })}>
          Schedule in Advance
        </Button>
          <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("CampusMap", { profilePic })}>
              Campus Map
          </Button>
      </View>
    </View>
  );
}
