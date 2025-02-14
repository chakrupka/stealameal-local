import React, { useState } from "react";
import { View, TextInput, Image, TouchableOpacity } from "react-native";
import { Button, Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import styles from "../styles"; 
import TopNav from "../components/TopNav";

export default function CreateAccount({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email (e.g., example@gmail.com)");
      return false;
    }
    setError("");
    return true;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleCreateAccount = () => {
    if (!validateEmail()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    navigation.navigate("WhatNow", { profilePic });
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Create Account" profilePic={profilePic} />

      <View style={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          style={styles.inputLarge}
          placeholder="Enter your email"
          placeholderTextColor="#bbb"
          value={email}
          onChangeText={setEmail}
          onBlur={validateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.inputLarge}
          placeholder="Enter a password"
          placeholderTextColor="#bbb"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button mode="contained" style={styles.button} onPress={handleCreateAccount}>
          Create Account
        </Button>
      </View>
    </View>
  );
}
