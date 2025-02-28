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

// Function to extract Firebase UID from JWT token
const extractUserIdFromToken = (token) => {
  try {
    console.log('Attempting to extract UID from token');
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token format, not a JWT');
      return null;
    }

    // Decode the payload (middle part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const payload = JSON.parse(jsonPayload);
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // Return the user_id from the payload
    const uid = payload.user_id || payload.sub;
    console.log('Extracted UID from token:', uid);
    return uid;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

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

  // Extract Firebase UID from token if needed
  const [firebaseUid, setFirebaseUid] = useState(null);

  useEffect(() => {
    // Try to extract Firebase UID from token when component mounts or currentUser changes
    if (currentUser?.idToken && !currentUser.userID) {
      const extractedUid = extractUserIdFromToken(currentUser.idToken);
      setFirebaseUid(extractedUid);
      console.log('Extracted Firebase UID from token:', extractedUid);
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

  const logUserInfo = () => {
    console.log('===== Current User Info =====');
    console.log('currentUser object:', JSON.stringify(currentUser, null, 2));
    console.log('MongoDB _id:', currentUser._id);
    console.log('userID (from currentUser):', currentUser.userID);
    console.log('Firebase UID (extracted from token):', firebaseUid);
    console.log('============================');
  };

  // Fixed handleAddFriend function
  const handleAddFriend = async () => {
    if (!selectedUserID) {
      Alert.alert('Please select a user first.');
      return;
    }

    // Log user information for debugging
    logUserInfo();

    try {
      // Get the selected user from search results
      const selectedUser = searchResults.find(
        (user) => user.userID === selectedUserID,
      );

      if (!selectedUser) {
        Alert.alert('Selected user not found in search results.');
        return;
      }

      console.log('Selected user:', JSON.stringify(selectedUser, null, 2));

      // IMPORTANT: Get Firebase UID from different sources in order of preference
      const senderID =
        currentUser.userID ||
        firebaseUid ||
        (currentUser.idToken
          ? extractUserIdFromToken(currentUser.idToken)
          : null);

      if (!senderID) {
        console.error(
          'No valid senderID available. Cannot send friend request.',
        );
        Alert.alert(
          'Error',
          'Could not determine your user ID. Please log out and log back in.',
        );
        return;
      }

      const senderName = `${currentUser.firstName} ${currentUser.lastName}`;
      const senderEmail = currentUser.email;

      console.log('Sending friend request with:', {
        senderID,
        senderName,
        senderEmail,
        receiverID: selectedUserID,
      });

      // Call the API with all required parameters
      const response = await sendFriendRequest(
        currentUser.idToken,
        senderID,
        senderName,
        senderEmail,
        selectedUserID,
      );

      // Display the user-friendly message if available, otherwise use a default message
      const message = response.userFriendlyMessage || 'Friend request sent!';
      Alert.alert('Success', message);

      setSelectedUserID(null); // Reset selection
      setEmail(''); // Clear search
    } catch (error) {
      console.error('Failed to send friend request:', error);

      // Extract the user-friendly message from the error response if available
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
