import React, { useState } from "react";
import { View, TextInput } from "react-native";
import { Button, Text } from "react-native-paper";
import styles from "../styles";
import TopNav from "../components/TopNav";

export default function Login({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Log In" profilePic={profilePic} />

      <View style={styles.content}>
        <Text style={styles.title}>Enter Your Details</Text>

        <TextInput 
          style={styles.inputLarge} 
          placeholder="Email" 
          placeholderTextColor="#bbb" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput 
          style={styles.inputLarge} 
          placeholder="Password" 
          placeholderTextColor="#bbb" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("WhatNow", { profilePic })}>
          Log In
        </Button>
      </View>
    </View>
  );
}
