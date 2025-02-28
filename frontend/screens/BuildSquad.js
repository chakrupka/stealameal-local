import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Checkbox, Text, Avatar, TextInput } from 'react-native-paper';
import styles from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';

// Constants
const LAYOUT = {
  listAdjustment: {
    top: 300,
  },
  bottomContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
    left: 0,
    right: 30,
    bottom: 30,
  },
  selectedItem: {
    backgroundColor: '#74C69D',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  inputContainer: {
    flex: 1,
    marginRight: 15,
    width: '60%',
  },
  inputStyle: {
    backgroundColor: 'white',
  },
};

export default function BuildSquad({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;

  // Access Zustand store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const createSquad = useStore((state) => state.squadSlice.createSquad);
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );

  // State
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [squadName, setSquadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  // Fetch friends on component mount
  useEffect(() => {
    const fetchFriendsData = async () => {
      setLoading(true);

      try {
        if (!currentUser?.friendsList || currentUser.friendsList.length === 0) {
          console.log('No friends list available');
          setFriendsList([]);
          return;
        }

        console.log(
          'Friends list:',
          JSON.stringify(currentUser.friendsList, null, 2),
        );

        // Fetch additional details for each friend
        const friendsWithDetails = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              // Fetch the friend's details from your API
              const details = await fetchFriendDetails(
                currentUser.idToken,
                friend.friendID,
              );

              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
              };
            } catch (error) {
              console.error(
                `Error fetching details for friend ${friend.friendID}:`,
                error,
              );
              // Return a fallback object if we can't get the details
              return {
                id: friend.friendID,
                name: `Unknown Friend`,
                email: 'Unknown',
              };
            }
          }),
        );

        setFriendsList(friendsWithDetails);
      } catch (error) {
        console.error('Error fetching friends data:', error);
        Alert.alert('Error', 'Failed to load your friends. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.friendsList) {
      fetchFriendsData();
    }
  }, [currentUser]);

  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity onPress={() => toggleSelection(item.id)}>
      <View
        style={[
          styles.listItem,
          selectedFriends.includes(item.id) ? LAYOUT.selectedItem : {},
        ]}
      >
        <View style={styles.listItemAvatar}>
          <Avatar.Text
            size={40}
            label={item.name ? item.name.charAt(0).toUpperCase() : '?'}
            style={{ backgroundColor: '#fff' }}
            labelStyle={{ color: '#000' }}
          />
        </View>

        <View style={styles.listItemContent}>
          <Text>{item.name}</Text>
        </View>

        <View style={styles.listItemCheckbox}>
          <Checkbox
            status={selectedFriends.includes(item.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleSelection(item.id)}
            color="#096A2E"
            uncheckedColor="#096A2E"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCreateSquad = async () => {
    if (selectedFriends.length === 0 || !squadName.trim()) {
      Alert.alert(
        'Error',
        'Please select at least one friend and provide a squad name',
      );
      return;
    }

    setLoading(true);
    try {
      // Prepare data for squad creation
      const squadData = {
        squadName: squadName.trim(),
        members: [...selectedFriends, currentUser.userID], // Include current user in squad
        createdBy: currentUser.userID,
      };

      // Create the squad
      const newSquad = await createSquad(squadData);

      // Refresh user profile to get updated squads
      await refreshUserProfile();

      // Success message
      Alert.alert('Success', `Squad "${squadName}" created successfully!`, [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('WhatNow', { newSquadId: newSquad._id }),
        },
      ]);
    } catch (error) {
      console.error('Failed to create squad:', error);
      Alert.alert(
        'Error',
        'Failed to create squad: ' + (error.message || 'Please try again'),
      );
    } finally {
      setLoading(false);
    }
  };

  const isSquadValid = selectedFriends.length > 0 && squadName.trim() !== '';

  // Show loading if friends are not yet loaded
  if (!currentUser || !currentUser.friendsList) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#096A2E" />
        <Text style={{ marginTop: 20 }}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Build a Squad"
        profilePic={profilePic}
      />

      <Text style={styles.header}>BUILD YOUR SQUAD</Text>

      <Text style={styles.subheader}>
        Select friends to create a new squad.
      </Text>

      {friendsList.length === 0 ? (
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ textAlign: 'center', marginTop: 30 }}>
            You haven't added any friends yet. Add friends first to create a
            squad.
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 20 }]}
            onPress={() => navigation.navigate('AddFriends')}
          >
            <Text style={styles.buttonText}>Add Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.listContainer, LAYOUT.listAdjustment]}>
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id}
              renderItem={renderFriend}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                  No friends found. Add some friends to create a squad.
                </Text>
              }
            />
          </View>

          <View style={[styles.bottomContainer, LAYOUT.bottomContainer]}>
            {/* Squad name input */}
            <View style={LAYOUT.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Enter squad name"
                value={squadName}
                onChangeText={setSquadName}
                style={LAYOUT.inputStyle}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#096A2E" />
            ) : (
              <TouchableOpacity
                style={[
                  styles.pingButton,
                  !isSquadValid ? LAYOUT.disabledButton : {},
                ]}
                disabled={!isSquadValid || loading}
                onPress={handleCreateSquad}
              >
                <Text style={styles.pingButtonLabel}>Create Squad</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}
