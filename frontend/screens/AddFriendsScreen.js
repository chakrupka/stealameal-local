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
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { searchUsersByEmail, sendFriendRequest } from '../services/user-api';

const extractUserIdFromToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const payload = JSON.parse(jsonPayload);
    const uid = payload.user_id || payload.sub;
    return uid;
  } catch (error) {
    return null;
  }
};

const AddFriendsScreen = ({ navigation, route }) => {
  const profilePic = route.params?.profilePic || null;

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const isLoggedIn = useStore((state) => state.userSlice.isLoggedIn);
  const searchResults = useStore((state) => state.userSlice.searchResults);
  const status = useStore((state) => state.userSlice.status);
  const searchUsers = useStore((state) => state.userSlice.searchUsers);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [selectedUserID, setSelectedUserID] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState(null);

  useEffect(() => {
    if (currentUser?.idToken && !currentUser.userID) {
      const extractedUid = extractUserIdFromToken(currentUser.idToken);
      setFirebaseUid(extractedUid);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [currentUser, isLoggedIn, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail('');
      setSelectedUserID(null);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (currentUser?.idToken && email) {
      setSearching(true);
      setSearchError(null);

      const delayDebounceFn = setTimeout(() => {
        searchUsers({ idToken: currentUser.idToken, email })
          .then(() => {})
          .catch((error) => {
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

  const isAlreadyFriend = (userId) => {
    if (!currentUser?.friendsList) return false;
    return currentUser.friendsList.some((friend) => friend.friendID === userId);
  };

  const handleAddFriend = async () => {
    if (!selectedUserID) {
      Alert.alert('Please select a user first.');
      return;
    }

    try {
      const selectedUser = searchResults.find(
        (user) => user.userID === selectedUserID,
      );

      if (!selectedUser) {
        Alert.alert('Selected user not found in search results.');
        return;
      }

      const senderID =
        currentUser.userID ||
        firebaseUid ||
        (currentUser.idToken
          ? extractUserIdFromToken(currentUser.idToken)
          : null);

      if (!senderID) {
        Alert.alert(
          'Error',
          'Could not determine your user ID. Please log out and log back in.',
        );
        return;
      }

      const senderName = `${currentUser.firstName} ${currentUser.lastName}`;
      const senderEmail = currentUser.email;

      const response = await sendFriendRequest(
        currentUser.idToken,
        senderID,
        senderName,
        senderEmail,
        selectedUserID,
      );

      const message = response.userFriendlyMessage || 'Friend request sent!';
      Alert.alert('Success', message);

      setSelectedUserID(null);
      setEmail('');
    } catch (error) {
      let errorMessage = 'Please try again.';

      if (error.response && error.response.data) {
        errorMessage =
          error.response.data.userFriendlyMessage ||
          error.response.data.message ||
          error.message ||
          errorMessage;
      }

      Alert.alert('Friend Request Status', errorMessage);
    }
  };

  if (!currentUser || !isLoggedIn) {
    return null;
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
            editable={true}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => Keyboard.dismiss()}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {searchError && <Text style={styles.errorText}>{searchError}</Text>}

        {searching && (
          <View style={styles.inlineLoadingContainer}>
            <ActivityIndicator
              size="small"
              color={styles.COLORS?.primary || '#096A2E'}
            />
            <Text style={styles.inlineLoadingText}>Searching...</Text>
          </View>
        )}

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.userID}
          renderItem={({ item }) => {
            const isSelected = item.userID === selectedUserID;
            const alreadyFriend = isAlreadyFriend(item.userID);
            return (
              <TouchableOpacity
                style={[
                  styles.userCard,
                  {
                    backgroundColor: isSelected
                      ? '#e0ffe0'
                      : alreadyFriend
                      ? '#f0f0f0'
                      : '#fff',
                  },
                ]}
                onPress={() => handleSelectUser(item.userID)}
                disabled={alreadyFriend}
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
                {alreadyFriend && (
                  <Text style={{ color: '#888', fontWeight: '600' }}>
                    Already Friends
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.resultsContentContainer}
          ListEmptyComponent={
            email.length > 0 && !searching ? (
              <Text style={styles.noResultsText}>
                No users found matching "{email}"
              </Text>
            ) : null
          }
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
