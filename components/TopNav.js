import React from "react";
import { Appbar, Avatar } from "react-native-paper";
import { SafeAreaView, View } from "react-native";
import styles from "../styles";

export default function TopNav({ navigation, title, profilePic }) {
  return (
    <SafeAreaView style={styles.topNav}>
      <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
      <Appbar.Content title={title} color="white" />
      {profilePic && <Avatar.Image size={40} source={{ uri: profilePic }} style={styles.avatar} />}
    </SafeAreaView>
  );
}
