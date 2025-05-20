import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Checkbox, Text, Avatar, TextInput } from 'react-native-paper';
import styles, { BOX_SHADOW } from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';

export default function BuildSquad({ navigation }) {
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const createSquad = useStore((state) => state.squadSlice.createSquad);
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [squadName, setSquadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  useEffect(() => {
    const fetchFriendsData = async () => {
      setLoading(true);
      try {
        if (!currentUser?.friendsList || currentUser.friendsList.length === 0) {
          setFriendsList([]);
          return;
        }
        const friendsWithDetails = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                currentUser.idToken,
                friend.friendID,
              );
              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                profilePic: details.profilePic,
              };
            } catch (error) {
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

  const renderFriend = ({ item, index }) => {
    const isLast = index === friendsList.length - 1;
    return (
      <TouchableOpacity onPress={() => toggleSelection(item.id)}>
        <View
          style={[
            localStyles.listItem,
            selectedFriends.includes(item.id) && localStyles.selectedItem,
            isLast && localStyles.lastListItem,
          ]}
        >
          <View style={localStyles.avatarWrap}>
            {!item.profilePic ? (
              <Avatar.Text
                size={40}
                label={item.name ? item.name.charAt(0).toUpperCase() : '?'}
                style={localStyles.avatarBg}
                labelStyle={localStyles.avatarLabel}
              />
            ) : (
              <Avatar.Image
                size={40}
                source={{ uri: item.profilePic }}
                style={localStyles.avatarBg}
              />
            )}
          </View>
          <View style={localStyles.listItemContent}>
            <Text>{item.name}</Text>
          </View>
          <View style={localStyles.listItemCheckbox}>
            <Checkbox
              status={
                selectedFriends.includes(item.id) ? 'checked' : 'unchecked'
              }
              onPress={() => toggleSelection(item.id)}
              color="#6750a4"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      const squadData = {
        squadName: squadName.trim(),
        members: [...selectedFriends, currentUser.userID],
        createdBy: currentUser.userID,
      };
      const newSquad = await createSquad(squadData);
      await refreshUserProfile();
      Alert.alert('Success', `Squad "${squadName}" created successfully!`, [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('WhatNow', { newSquadId: newSquad._id }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create squad: ' + (error.message || 'Please try again'),
      );
    } finally {
      setLoading(false);
    }
  };

  const isSquadValid = selectedFriends.length > 0 && squadName.trim() !== '';

  if (!currentUser || !currentUser.friendsList) {
    return (
      <View style={[styles.container, localStyles.centerContent]}>
        <ActivityIndicator size="large" color="#096A2E" />
        <Text style={localStyles.marginTop20}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Build a Squad" />
      <View style={localStyles.spacer} />
      <View style={localStyles.headerContainer}>
        <Text style={localStyles.headerText}>Build your squad</Text>
      </View>
      <Text style={localStyles.subheader}>
        Select friends to create a new squad.
      </Text>
      {friendsList.length === 0 ? (
        <View style={[styles.content, localStyles.centerContent]}>
          <Text style={localStyles.noFriendsText}>
            You haven't added any friends yet. Add friends first to create a
            squad.
          </Text>
          <TouchableOpacity
            style={[styles.button, localStyles.addFriendsButton]}
            onPress={() => navigation.navigate('AddFriendsScreen')}
          >
            <Text style={[styles.buttonText, localStyles.addFriendsButtonText]}>
              Add Friends
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={localStyles.listContainer}>
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id}
              renderItem={renderFriend}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={localStyles.flatlistPaddingBottom}
              ListEmptyComponent={
                <Text style={localStyles.noFriendsText}>
                  No friends found. Add some friends to create a squad.
                </Text>
              }
            />
          </View>
          <View style={localStyles.bottomBar}>
            <View style={localStyles.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Enter squad name"
                value={squadName}
                onChangeText={setSquadName}
                style={[localStyles.input, localStyles.inputAlignStart]}
              />
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#096A2E" />
            ) : (
              <TouchableOpacity
                style={[
                  localStyles.createBtn,
                  !isSquadValid && localStyles.createBtnDisabled,
                ]}
                disabled={!isSquadValid || loading}
                onPress={handleCreateSquad}
              >
                <Text style={localStyles.createBtnLabel}>Create Squad</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  spacer: {
    height: Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + 40,
  },
  headerContainer: {
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750a4',
    textAlign: 'center',
    marginBottom: 10,
  },
  subheader: {
    marginTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 40,
    backgroundColor: '#f8f8ff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#6750a4',
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f8ff',
  },
  listItemContent: {
    width: 212,
    justifyContent: 'center',
    elevation: 1,
  },
  listItemCheckbox: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  selectedItem: {
    backgroundColor: '#e9e6ff',
  },
  lastListItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatarBg: {
    backgroundColor: '#fff',
  },
  avatarLabel: {
    color: '#000',
  },
  noFriendsText: {
    textAlign: 'center',
    marginTop: 20,
  },
  addFriendsButton: {
    backgroundColor: '#096A2E',
    marginTop: 20,
  },
  addFriendsButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  flatlistPaddingBottom: {
    paddingBottom: 80,
  },
  inputContainer: {
    flex: 1,
    marginRight: 15,
  },
  input: {
    flex: 1,
    paddingRight: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputAlignStart: {
    alignItems: 'flex-start',
  },
  createBtn: {
    backgroundColor: '#6750a4',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    ...BOX_SHADOW,
  },
  createBtnDisabled: {
    backgroundColor: '#ccc',
  },
  createBtnLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  marginTop20: {
    marginTop: 20,
  },
});
