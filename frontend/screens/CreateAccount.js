import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import styles, { FILL_HEIGHT_WIDTH, FLEX_ROW_CENTER } from '../styles';
import TopNav from '../components/TopNav';
import { signInUser } from '../services/firebase-auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import uploadImage from '../services/s3';

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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      z,
    });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize({ width: 800 });
      const image = await context.renderAsync();
      const { uri } = await image.saveAsync({
        format: 'jpeg',
        compress: 0.6,
      });
      const fileName = `${uri.split('/').pop().split('.')[0]}.jpeg`;
      const file = {
        uri,
        name: fileName,
        type: 'image/jpeg',
      };
      setProfilePic({
        fileName,
        preview: uri,
        file,
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      setError('');

      await logout();
      console.log('Logged out any existing user');

      const profilePicUrl = profilePic
        ? await uploadImage(profilePic.file)
        : 'https://tripcoordinator.s3.amazonaws.com/7AF4A5DC-22C0-4D3F-8357-2DCC6DE85437.jpeg';

      const userData = {
        email,
        password,
        firstName,
        lastName,
        profilePic: profilePicUrl,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        },
      );

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
        navigation.navigate('WhatNow');
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
      <TopNav navigation={navigation} title="Create Account" />

      <View style={styles.createAccountProfilePicContainer}>
        <TouchableOpacity onPress={pickImage} style={{ ...FILL_HEIGHT_WIDTH }}>
          {profilePic ? (
            <Image
              source={{ uri: profilePic.preview }}
              style={styles.createAccountProfilePicImage}
            />
          ) : (
            <View style={{ ...FLEX_ROW_CENTER, ...FILL_HEIGHT_WIDTH }}>
              <MaterialCommunityIcons
                name="account-edit"
                color="lightgrey"
                size={50}
              ></MaterialCommunityIcons>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ ...FLEX_ROW_CENTER }}>
        <Text style={styles.createAccountProfilePicSubheader}>
          Profile Picture
        </Text>
      </View>

      <View style={styles.createAccountInputContainer}>
        <TextInput
          style={styles.createAccountInput}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.createAccountInputContainer}>
        <TextInput
          style={styles.createAccountInput}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.createAccountInputContainer}>
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

      <View style={styles.createAccountInputContainer}>
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
          style={{ marginTop: 15 }}
        />
      ) : (
        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={handleCreateAccount}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Create Account
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
