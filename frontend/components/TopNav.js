import React from 'react';
import {
  SafeAreaView,
  View,
  Alert,
  Text,
  Button,
  TouchableOpacity,
} from 'react-native';
import styles from '../styles';
import useStore from '../store';
import { MaterialIcons } from '@expo/vector-icons';

export default function TopNav({ navigation, title }) {
  const { logout, currentUser } = useStore((state) => state.userSlice);

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
      <TouchableOpacity onPress={handleBackAction} style={styles.navIcon}>
        <MaterialIcons
          name={isWhatNowScreen ? 'logout' : 'arrow-back'}
          size={35}
        />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      {currentUser && isWhatNowScreen ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.accountIcon}
        >
          <MaterialIcons name="account-circle" size={35} />
        </TouchableOpacity>
      ) : (
        <View style={styles.navPlaceholder}></View>
      )}
    </SafeAreaView>
  );
}
