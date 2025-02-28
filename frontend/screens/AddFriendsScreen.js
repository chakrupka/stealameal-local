import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { Text, Avatar, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store'; // Import the Zustand store
import styles from '../styles';
import TopNav from '../components/TopNav';
import { searchUsersByEmail, sendFriendRequest } from '../services/user-api';

const AddFriendsScreen = ({ navigation, route }) => {
  const profilePic = route.params?.profilePic || null;

  // Access the Zustand store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const isLoggedIn = useStore((state) => state.userSlice.isLoggedIn);
  const searchResults = useStore((state) => state.userSlice.searchResults);
  const status = useStore((state) => state.userSlice.status);
  const searchUsers = useStore((state) => state.userSlice.searchUsers);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Track which user is selected
  const [selectedUserID, setSelectedUserID] = useState(null);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [currentUser, isLoggedIn, navigation]);

  // Debounce the search
  useEffect(() => {
    if (currentUser?.idToken && email) {
      setSearching(true);
      setSearchError(null);
      const delayDebounceFn = setTimeout(() => {
        // Call store's searchUsers
        searchUsers({ idToken: currentUser.idToken, email })
          .then((res) => {
            // The store will update state.userSlice.searchResults for you
            console.log(
              'Search complete in store. Updated searchResults:',
              res,
            );
          })
          .catch((error) => {
            console.error('Search error:', error);
            setSearchError('Failed to search. Please try again.');
          })
          .finally(() => {
            setSearching(false);
          });
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [currentUser, email, searchUsers]);
  const handleSelectUser = (userID) => {
    setSelectedUserID(userID === selectedUserID ? null : userID);
  };

  const handleAddFriend = async () => {
    if (!selectedUserID) {
      Alert.alert('Please select a user first.');
      return;
    }

    try {
      await sendFriendRequest(
        currentUser.idToken,
        currentUser.userID,
        selectedUserID,
      );
      Alert.alert('Friend request sent!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      Alert.alert('Failed to send friend request. Please try again.');
    }
  };

  if (!currentUser || !isLoggedIn) {
    return null;
  }

  if (!currentUser || !isLoggedIn) {
    return null;
  }

  if (!currentUser || !isLoggedIn) {
    return null;
  }

  if (status === 'loading' || searching) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Add Friends"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={styles.COLORS?.primary || '#096A2E'}
          />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Add Friends"
        profilePic={profilePic}
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Search by email"
            placeholderTextColor="#888"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => Keyboard.dismiss()}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {searchError && <Text style={styles.errorText}>{searchError}</Text>}

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.userID}
          renderItem={({ item }) => {
            const isSelected = item.userID === selectedUserID;
            return (
              <TouchableOpacity
                style={[
                  styles.userCard,
                  { backgroundColor: isSelected ? '#e0ffe0' : '#fff' },
                ]}
                onPress={() => handleSelectUser(item.userID)}
              >
                <View style={styles.userCardInfo}>
                  <Avatar.Text
                    size={40}
                    label={item.name ? item.name.charAt(0).toUpperCase() : ''}
                  />
                  <View style={styles.userCardText}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                </View>
                {isSelected && (
                  <Text style={{ color: '#096A2E', fontWeight: '600' }}>
                    Selected
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.resultsContentContainer}
        />

        {selectedUserID && (
          <Button
            mode="contained"
            onPress={handleAddFriend}
            color="#096A2E"
            style={[styles.addButton, { marginTop: 16 }]}
          >
            Confirm Add Friend
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AddFriendsScreen;
