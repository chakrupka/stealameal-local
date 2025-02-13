import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import styles from "../styles"; 
import TopNav from "../components/TopNav";

export default function ScheduleMeal({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Schedule a Meal" profilePic={profilePic} />

      <View style={styles.content}>
        <Text style={styles.title}>Plan Your Meal</Text>

        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("PickFriend", { profilePic })}>
          Pick a Friend or Squad
        </Button>
        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("BuildSquad", { profilePic })}>
          Build a Squad
        </Button>
      </View>
    </View>
  );
}
