import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import styles, { BOX_SHADOW } from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import uploadImage from '../services/s3';
import { Button } from 'react-native-paper';

const Profile = ({ navigation, route }) => {
  const { currentUser, updateUserInfo } = useStore((state) => state.userSlice);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser?.firstName);
  const [lastName, setLastName] = useState(currentUser?.lastName);
  const [profilePic, setProfilePic] = useState({
    fileName: null,
    preview: currentUser?.profilePic,
    file: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
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

  const handleStopEditing = () => {
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setProfilePic({
      fileName: null,
      preview: currentUser.profilePic,
      file: null,
    });
    setEditing(false);
  };

  const handleUpdateAccount = async () => {
    if (firstName.trim() === '' || lastName.trim() === '') {
      setError('First name and last name are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const profilePicUrl = profilePic.file
        ? await uploadImage(profilePic.file)
        : profilePic.preview;

      const userInfo = {
        firstName,
        lastName,
        profilePic: profilePicUrl,
      };

      const response = await updateUserInfo(userInfo);

      if (!response.success) {
        throw new Error(
          response.error?.error || response.error || 'Failed to update account',
        );
      }

      const newUserData = response.userData;
      setFirstName(newUserData.firstName);
      setLastName(newUserData.lastName);
      setProfilePic({
        fileName: null,
        preview: newUserData.profilePic,
        file: null,
      });
      console.log('Account updated successfully:', newUserData);
    } catch (err) {
      console.error('Error updating account:', err.message);
      setError(err.message || 'Failed to update account. Please try again.');
    } finally {
      setEditing(false);
      setLoading(false);
    }
  };

  return (
    <View style={styles.profileView.main}>
      <TopNav navigation={navigation} title="Profile" />
      {!editing ? (
        <View style={styles.profileView.container}>
          <Image
            source={{ uri: currentUser?.profilePic }}
            style={styles.profileView.profilePic}
          />
          <Text style={styles.profileView.name}>
            {currentUser?.firstName} {currentUser?.lastName}
          </Text>
          <Text style={styles.profileView.email}>{currentUser?.email}</Text>
          <View style={localStyles.buttonContainer}>
            <TouchableOpacity
              style={[styles.profileView.button, localStyles.smallButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={localStyles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('LocationSettings')}
              style={[styles.profileView.button, localStyles.smallButton]}
            >
              <Text style={localStyles.buttonText}>Location Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileView.editContainer}>
          <View style={styles.profileView.editPicContainer}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.profileView.editProfilePic}
            >
              <Image
                source={{ uri: profilePic.preview }}
                style={styles.profileView.editProfilePic}
              />
              {!profilePic.file && (
                <>
                  <View style={styles.profileView.editProfilePicShade} />
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={50}
                    style={styles.profileView.editProfilePicIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.profileView.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.profileView.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#096A2E"
              style={localStyles.marginTop15}
            />
          ) : (
            <View style={styles.profileView.editButtons}>
              <TouchableOpacity
                style={[styles.profileView.button, localStyles.cancelButton]}
                onPress={handleStopEditing}
              >
                <Text style={localStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileView.button, localStyles.updateButton]}
                onPress={handleUpdateAccount}
              >
                <Text style={[localStyles.buttonText, { color: 'white' }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  buttonContainer: {
    marginTop: 30,
    gap: 10,
    flexDirection: 'column',
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: -5,
    height: 'auto',
    width: 'auto',
    ...BOX_SHADOW,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 500,
    color: 'white',
  },
  marginTop15: {
    marginTop: 15,
  },
  updateButton: {
    backgroundColor: '#6750a4',
    ...BOX_SHADOW,
  },
  cancelButton: {
    backgroundColor: 'lightcoral',
    ...BOX_SHADOW,
  },
});

export default Profile;
