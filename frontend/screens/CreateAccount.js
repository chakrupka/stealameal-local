import React, { useState } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { createUser, signInUser, signOutUser } from '../services/firebase-auth';
import useStore from '../store';

export default function CreateAccount({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

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

      console.log('Attempting to log in with new account');

      const idToken = await signInUser(email, password);
      console.log('Obtained ID Token for new user:', idToken);

      const loginResult = await login({
        email,
        password,
        idToken,
      });

      if (loginResult.success) {
        console.log('Successfully logged in as new user');
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
    <View style={styles.createAccountContainer}>
      <TopNav
        navigation={navigation}
        title="Create Account"
        profilePic={profilePic}
      />

      <Text style={styles.createAccountHeader}>Sign Up</Text>

      <View
        style={[styles.createAccountInputContainer, { top: 200, left: 90 }]}
      >
        <TextInput
          style={styles.createAccountInput}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View
        style={[styles.createAccountInputContainer, { top: 240, left: 90 }]}
      >
        <TextInput
          style={styles.createAccountInput}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View
        style={[styles.createAccountInputContainer, { top: 280, left: 90 }]}
      >
        <TextInput
          style={styles.createAccountInput}
          placeholder="Email"
          value={email}
          placeholderTextColor="#bbb"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View
        style={[styles.createAccountInputContainer, { top: 320, left: 90 }]}
      >
        <TextInput
          style={styles.createAccountInput}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#096A2E"
          style={{ position: 'absolute', top: 593, alignSelf: 'center' }}
        />
      ) : (
        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={handleCreateAccount}
        >
          <Text>Create Account</Text>
        </TouchableOpacity>
      )}

      <Image
        source={require('../assets/raccoonnobackground.png')}
        style={styles.createAccountLogo}
      />
    </View>
  );
}
