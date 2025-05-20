import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Text, Avatar, Button, Searchbar } from 'react-native-paper';
import useStore from '../store';
import styles, { BOX_SHADOW } from '../styles';
import TopNav from '../components/TopNav';
import { sendFriendRequest } from '../services/user-api';

const extractUserIdFromToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    return payload.user_id || payload.sub;
  } catch {
    return null;
  }
};

const AddFriendsScreen = ({ navigation }) => {
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const isLoggedIn = useStore((state) => state.userSlice.isLoggedIn);
  const searchResults = useStore((state) => state.userSlice.searchResults);
  const searchUsers = useStore((state) => state.userSlice.searchUsers);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedUserID, setSelectedUserID] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState(null);

  useEffect(() => {
    if (currentUser?.idToken && !currentUser.userID) {
      setFirebaseUid(extractUserIdFromToken(currentUser.idToken));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
      const handler = setTimeout(() => {
        searchUsers({ idToken: currentUser.idToken, email })
          .catch(() => setSearchError('Failed to search. Please try again.'))
          .finally(() => setSearching(false));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [currentUser, email, searchUsers]);

  const handleSelectUser = (userID) => {
    setSelectedUserID((prev) => (prev === userID ? null : userID));
  };

  const isAlreadyFriend = (userId) =>
    currentUser?.friendsList?.some((f) => f.friendID === userId);

  const handleAddFriend = async () => {
    if (!selectedUserID) {
      Alert.alert('Please select a user first.');
      return;
    }
    const selectedUser = searchResults.find((u) => u.userID === selectedUserID);
    if (!selectedUser) {
      Alert.alert('Selected user not found in search results.');
      return;
    }
    const senderID =
      currentUser.userID ||
      firebaseUid ||
      (currentUser.idToken && extractUserIdFromToken(currentUser.idToken));
    if (!senderID) {
      Alert.alert(
        'Error',
        'Could not determine your user ID. Please log out and log back in.',
      );
      return;
    }
    try {
      const response = await sendFriendRequest(
        currentUser.idToken,
        senderID,
        `${currentUser.firstName} ${currentUser.lastName}`,
        currentUser.email,
        selectedUserID,
      );
      Alert.alert(
        'Success',
        response.userFriendlyMessage || 'Friend request sent!',
      );
      setSelectedUserID(null);
      setEmail('');
    } catch (error) {
      const msg =
        error.response?.data?.userFriendlyMessage ||
        error.response?.data?.message ||
        error.message ||
        'Please try again.';
      Alert.alert('Friend Request Status', msg);
    }
  };

  if (!currentUser || !isLoggedIn) return null;

  return (
    <SafeAreaView style={styles.container}>
      <TopNav navigation={navigation} title="Add Friends" />
      <View style={[styles.content, localStyles.fullWidth]}>
        <View style={localStyles.searchContainer}>
          <Searchbar
            placeholder="Search by email"
            onChangeText={setEmail}
            value={email}
            style={localStyles.searchBar}
            autoCapitalize="none"
          />
        </View>

        {searchError && <Text style={styles.errorText}>{searchError}</Text>}

        {searching && (
          <View style={localStyles.searchingContainer}>
            <ActivityIndicator
              size="small"
              color={styles.COLORS?.primary || '#f8f8ff'}
            />
            <Text style={styles.inlineLoadingText}>Searching...</Text>
          </View>
        )}

        {!searching && (
          <View style={localStyles.resultsContainer}>
            <FlatList
              style={{ width: '100%' }}
              data={searchResults}
              keyExtractor={(item) => item.userID}
              renderItem={({ item }) => {
                const isSelected = item.userID === selectedUserID;
                const already = isAlreadyFriend(item.userID);
                return (
                  <TouchableOpacity
                    style={[
                      styles.userCard,
                      {
                        backgroundColor: isSelected
                          ? '#e9e6ff'
                          : already
                          ? '#f0f0f0'
                          : '#fff',
                      },
                    ]}
                    onPress={() => handleSelectUser(item.userID)}
                    disabled={already}
                  >
                    <View style={styles.userCardInfo}>
                      {!item.profilePic ? (
                        <Avatar.Text
                          size={40}
                          label={item.name?.charAt(0).toUpperCase()}
                        />
                      ) : (
                        <Avatar.Image
                          size={40}
                          source={{ uri: item.profilePic }}
                        />
                      )}
                      <View style={[styles.userCardText, localStyles.cardText]}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text
                          style={[styles.userEmail, localStyles.cardText]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.email}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Text style={localStyles.selectedText}>Selected</Text>
                    )}
                    {already && (
                      <Text style={localStyles.alreadyText}>
                        Already Friends
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.resultsContentContainer}
              ListEmptyComponent={
                email &&
                !searching && (
                  <Text style={localStyles.noResultsText}>
                    No users found matching "{email}"
                  </Text>
                )
              }
            />
          </View>
        )}

        {selectedUserID ? (
          <Button
            mode="contained"
            onPress={handleAddFriend}
            textColor="white"
            style={localStyles.confirmButton}
          >
            Confirm Add Friend
          </Button>
        ) : (
          <View style={localStyles.emptySpace} />
        )}
      </View>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  fullWidth: { width: '95%' },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
  },
  searchingContainer: {
    height: '80%',
  },
  resultsContainer: {
    height: '80%',
    width: '110%',
    alignItems: 'center',
  },
  cardText: {
    width: '65%',
  },
  selectedText: {
    color: '#6750a4',
    fontWeight: '600',
    marginLeft: -5,
  },
  alreadyText: {
    color: '#888',
    fontWeight: '600',
    width: 60,
  },
  confirmButton: {
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 5,
    ...BOX_SHADOW,
  },
  emptySpace: { height: 60 },
  noResultsText: {
    textAlign: 'center',
  },
});

export default AddFriendsScreen;

//rgb(132, 124, 196)
