import React from 'react';
import { Appbar, Avatar } from 'react-native-paper';
import { SafeAreaView, View, Alert } from 'react-native';
import styles from '../styles';
import useStore from '../store';
import { MaterialIcons } from '@expo/vector-icons';

export default function TopNav({ navigation, title, profilePic }) {
  const logout = useStore((state) => state.userSlice.logout);

  const isWhatNowScreen = title === 'What Now?';

  const handleBackAction = async () => {
    if (isWhatNowScreen) {
      Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Starter' }],
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
        <View style={{ paddingLeft: 10 }}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="white"
            onPress={handleBackAction}
          />
        </View>
      )}
      <Appbar.Content title={title} color="white" />
      {profilePic && (
        <Avatar.Image
          size={4}
          source={{ uri: profilePic }}
          style={styles.avatar}
        />
      )}
    </SafeAreaView>
  );
}
