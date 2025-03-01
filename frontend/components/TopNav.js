import React from 'react';
import { Appbar, Avatar } from 'react-native-paper';
import { SafeAreaView, View, Alert } from 'react-native';
import styles from '../styles';
import useStore from '../store';

export default function TopNav({ navigation, title, profilePic }) {
  const logout = useStore((state) => state.userSlice.logout);

  const isWhatNowScreen = title === 'What Now?';

  const handleBackAction = async () => {
    if (isWhatNowScreen) {
      // Show confirmation dialog for logout
      Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Call the logout function from store
              await logout();
              // Navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Logout Failed', 'Please try again.');
            }
          },
        },
      ]);
    } else {
      // Regular back navigation for other screens
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.topNav}>
      {isWhatNowScreen ? (
        <Appbar.Action icon="logout" color="white" onPress={handleBackAction} />
      ) : (
        <Appbar.BackAction color="white" onPress={handleBackAction} />
      )}
      <Appbar.Content title={title} color="white" />
      {profilePic && (
        <Avatar.Image
          size={40}
          source={{ uri: profilePic }}
          style={styles.avatar}
        />
      )}
    </SafeAreaView>
  );
}
