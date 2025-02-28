// src/screens/Login.js
import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { signInUser } from '../services/firebase-auth';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';

export default function Login({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple way to store user state in Zustand
  const setLoggedInUser = (user) => {
    useStore.setState((state) => {
      state.userSlice.currentUser = user;
      state.userSlice.isLoggedIn = true;
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Sign in with Firebase
      const idToken = await signInUser(email, password);

      // 2. Fetch user from your backend: GET /api/auth
      const response = await fetch(`http://localhost:9090/api/auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to login');
      }

      // 3. Parse user data
      const userData = await response.json();

      // 4. Save user + token in Zustand
      setLoggedInUser({
        ...userData,
        idToken,
      });

      // 5. Navigate to main screen
      navigation.navigate('WhatNow', { profilePic });
    } catch (err) {
      console.error('Login error:', err.message);

      let errorMessage =
        'Login failed. Please check your credentials and try again.';
      if (
        err.message.includes('auth/user-not-found') ||
        err.message.includes('auth/wrong-password')
      ) {
        errorMessage = 'Invalid email or password';
      } else if (err.message.includes('auth/too-many-requests')) {
        errorMessage =
          'Too many failed login attempts. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#096A2E" />
        ) : (
          <Button mode="contained" style={styles.button} onPress={handleLogin}>
            Log In
          </Button>
        )}
      </View>
    </View>
  );
}
