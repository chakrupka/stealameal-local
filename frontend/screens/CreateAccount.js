// src/screens/CreateAccount.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { createUser, signInUser, signOutUser } from '../services/firebase-auth'; // Import Firebase auth services
import useStore from '../store'; // Import Zustand store

export default function CreateAccount({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  // Get login and logout functions from the store
  const login = useStore((state) => state.userSlice.login);
  const logout = useStore((state) => state.userSlice.logout);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email (e.g., example@gmail.com)');
      return false;
    }
    setError('');
    return true;
  };

  const validateFields = () => {
    if (firstName.trim() === '' || lastName.trim() === '') {
      setError('First name and last name are required.');
      return false;
    }
    if (!validateEmail()) return false;
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    setError('');
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

  const handleCreateAccount = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      setError('');

      // 1. First, if there's a current user, log them out
      await logout();
      console.log('Logged out any existing user');

      // 2. Prepare the request payload
      const userData = {
        email,
        password,
        firstName,
        lastName,
        profilePic,
      };

      // 3. POST to /api/auth to create the user
      const response = await fetch('http://localhost:9090/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const newUserData = await response.json();
      console.log('Account created successfully:', newUserData);

      // 4. Now log in with the newly created account
      console.log('Attempting to log in with new account');

      // Sign in with Firebase to get the ID token
      const idToken = await signInUser(email, password);
      console.log('Obtained ID Token for new user:', idToken);

      // 5. Use the store's login function to set up the user state
      const loginResult = await login({
        email,
        password,
        idToken,
      });

      if (loginResult.success) {
        console.log('Successfully logged in as new user');
        // Navigate to home screen
        navigation.navigate('WhatNow', { profilePic });
      } else {
        setError(loginResult.error || 'Login after account creation failed');
      }
    } catch (err) {
      console.error('Error creating account:', err.message);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TopNav
        navigation={navigation}
        title="Create Account"
        profilePic={profilePic}
      />
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
          placeholder="Enter your first name"
          placeholderTextColor="#bbb"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.inputLarge}
          placeholder="Enter your last name"
          placeholderTextColor="#bbb"
          value={lastName}
          onChangeText={setLastName}
        />
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput
          style={styles.inputLarge}
          placeholder="Enter a password"
          placeholderTextColor="#bbb"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#096A2E" />
        ) : (
          <Button
            mode="contained"
            style={styles.button}
            onPress={handleCreateAccount}
          >
            Create Account
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
