import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { signInUser } from '../services/firebase-auth';
import useStore from '../store';
import styles from '../styles';
import { USER_API_URL } from '../configs/api-config';
import TopNav from '../components/TopNav';

export default function Login({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useStore((state) => state.userSlice.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const idToken = await signInUser(email, password);
      console.log('Obtained ID Token:', idToken);

      try {
        console.log(
          'Attempting to fetch user data from:',
          `${USER_API_URL}/auth`,
        );
        console.log('Using ID Token:', idToken);

        const response = await fetch(`${USER_API_URL}/auth`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const userData = await response.json();
        console.log('Fetched user data:', userData);

        const loginResult = await useStore.getState().userSlice.login({
          email,
          password,
          idToken,
        });

        if (loginResult.success) {
          navigation.navigate('WhatNow', { profilePic });
        } else {
          setError(loginResult.error || 'Login failed');
        }
      } catch (fetchError) {
        console.error('Fetch user error details:', fetchError);
        console.error('Error name:', fetchError.name);
        console.error('Error message:', fetchError.message);

        if (fetchError.message.includes('Network request failed')) {
          setError(
            'Unable to connect to the server. Please check your network connection.',
          );
        } else {
          setError(fetchError.message || 'Failed to fetch user data');
        }
      }
    } catch (err) {
      console.error('Login error:', err);

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

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Starter');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <TopNav
        navigation={navigation}
        title="Log In"
        profilePic={profilePic}
        onBackPress={handleBackPress}
      />

      <Text style={styles.loginHeader}>Log In</Text>

      <View style={[styles.loginInputContainer, { top: 250, left: 90 }]}>
        <TextInput
          style={styles.loginInput}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.loginInputContainer, { top: 300, left: 90 }]}>
        <TextInput
          style={styles.loginInput}
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
          style={{ position: 'absolute', top: 400, alignSelf: 'center' }}
        />
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text>Log In</Text>
        </TouchableOpacity>
      )}

      <Image
        source={require('../assets/raccoonnobackground.png')}
        style={styles.createAccountLogo}
      />
    </View>
  );
}
