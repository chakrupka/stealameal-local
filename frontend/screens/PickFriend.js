import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Checkbox,
  Text,
  Avatar,
  Button,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { fetchFriendDetails } from '../services/user-api';

// constants for local styling. we might wanna move this to styles page.
const BUTTON_STYLES = {
  dateTime: {
    width: 200,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(174,207,117,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  send: {
    width: 100,
    height: 52,
    backgroundColor: 'rgba(174,207,117,0.75)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sendText: {
    color: '#096A2E',
    marginRight: 3,
  },
};

const LAYOUT = {
  buttonRow: {
    position: 'absolute',
    top: 290,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 5,
    backgroundColor: 'white',
    zIndex: 1,
  },
  listAdjustment: {
    top: 350,
    height: 520,
  },
  bottomContainer: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  memberStyle: {
    paddingLeft: 50,
    backgroundColor: '#f5f5f5',
  },
  selectedItem: {
    backgroundColor: '#74C69D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  squadHeader: {
    backgroundColor: '#e6f2ff',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  squadName: {
    fontWeight: 'bold',
    flex: 1,
    fontSize: 16,
  },
  memberCount: {
    color: '#666',
    fontSize: 12,
    marginLeft: 5,
  },
  expandButton: {
    padding: 5,
  },
};

export default function PickFriend({ navigation, route }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combinedData, setCombinedData] = useState([]);
  const [error, setError] = useState(null);
  const [expandedSquads, setExpandedSquads] = useState({});
  const [dataFetched, setDataFetched] = useState(false);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const squads = useStore((state) => state.squadSlice.squads);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);

  const loadData = useCallback(async () => {
    if (!currentUser?.userID || dataFetched) return;

    try {
      setLoading(true);
      setError(null);

      if (!squads || squads.length === 0) {
        await getUserSquads(currentUser.userID);
      }

      let processedData = [];

      if (currentUser.friendsList && currentUser.friendsList.length > 0) {
        const processedFriends = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                currentUser.idToken,
                friend.friendID,
              );

              const initials = `${details.firstName.charAt(
                0,
              )}${details.lastName.charAt(0)}`.toUpperCase();

              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                initials: initials,
                type: 'friend',
              };
            } catch (error) {
              console.error(
                `Error processing friend ${friend.friendID}:`,
                error,
              );
              return {
                id: friend.friendID,
                name: `Friend ${friend.friendID.substring(0, 5)}`,
                email: 'Unknown',
                initials: '?',
                type: 'friend',
              };
            }
          }),
        );

        processedData = [...processedData, ...processedFriends];
      }

      if (squads && squads.length > 0) {
        const processedSquads = await Promise.all(
          squads.map(async (squad) => {
            const memberDetails = await Promise.all(
              squad.members.map(async (memberId) => {
                try {
                  // Skip if it's the current user
                  if (memberId === currentUser.userID) {
                    return {
                      id: memberId,
                      name: `${currentUser.firstName} ${currentUser.lastName} (You)`,
                      email: currentUser.email,
                      initials: `${currentUser.firstName.charAt(
                        0,
                      )}${currentUser.lastName.charAt(0)}`.toUpperCase(),
                    };
                  }

                  const details = await fetchFriendDetails(
                    currentUser.idToken,
                    memberId,
                  );

                  const initials = `${details.firstName.charAt(
                    0,
                  )}${details.lastName.charAt(0)}`.toUpperCase();

                  return {
                    id: memberId,
                    name: `${details.firstName} ${details.lastName}`.trim(),
                    email: details.email,
                    initials: initials,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching details for squad member ${memberId}:`,
                    error,
                  );
                  return {
                    id: memberId,
                    name: 'Unknown Member',
                    email: 'Unknown',
                    initials: '?',
                  };
                }
              }),
            );

            // Create ssquad entry
            return {
              id: squad._id,
              name: squad.squadName,
              type: 'squad',
              members: memberDetails,
              memberCount: squad.members.length,
            };
          }),
        );

        processedData = [...processedData, ...processedSquads];
      }

      setCombinedData(processedData);
      setDataFetched(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load your friends and squads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, squads, getUserSquads, dataFetched]);

  useEffect(() => {
    if (currentUser?.userID && !dataFetched) {
      loadData();
    }
  }, [currentUser, loadData, dataFetched]);

  const toggleSelection = (id, type) => {
    setSelectedItems((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev.filter((item) => item.id !== id);
      }

      return [...prev, { id, type }];
    });
  };

  const toggleSquadExpansion = (squadId) => {
    setExpandedSquads((prev) => ({
      ...prev,
      [squadId]: !prev[squadId],
    }));
  };

  const getAllSelectedMembers = () => {
    const selectedFriendIds = selectedItems
      .filter((item) => item.type === 'friend')
      .map((item) => item.id);

    const selectedSquads = selectedItems
      .filter((item) => item.type === 'squad')
      .map((item) => item.id);

    const squadMembers = combinedData
      .filter(
        (item) => item.type === 'squad' && selectedSquads.includes(item.id),
      )
      .flatMap((squad) => squad.members.map((member) => member.id));

    return [...new Set([...selectedFriendIds, ...squadMembers])];
  };

  const getFlatListData = () => {
    let data = [];

    combinedData.forEach((item) => {
      if (item.type === 'friend') {
        data.push(item);
      } else if (item.type === 'squad') {
        // Add the squad header
        data.push(item);

        // If expanded, add all members
        if (expandedSquads[item.id]) {
          item.members.forEach((member) => {
            data.push({
              ...member,
              type: 'squadMember',
              squadId: item.id,
              isSquadMember: true,
            });
          });
        }
      }
    });

    return data;
  };

  const renderItem = ({ item }) => {
    if (item.type === 'squad') {
      const isSelected = selectedItems.some(
        (selected) => selected.id === item.id && selected.type === 'squad',
      );
      const isExpanded = expandedSquads[item.id];

      const otherMembers = item.members.filter(
        (member) => member.id !== currentUser.userID,
      );
      const firstFourMembers = otherMembers.slice(0, 4);
      const additionalMembersCount = otherMembers.length - 4;

      return (
        <TouchableOpacity onPress={() => toggleSelection(item.id, 'squad')}>
          <View
            style={[LAYOUT.squadHeader, isSelected ? LAYOUT.selectedItem : {}]}
          >
            <Avatar.Icon
              size={40}
              icon="account-group"
              style={{ backgroundColor: isSelected ? '#5db386' : '#a1d6e2' }}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={LAYOUT.squadName}>{item.name}</Text>
              <Text style={LAYOUT.memberCount}>
                {firstFourMembers
                  .map((member) => member.name.split(' ')[0])
                  .join(', ')}
                {additionalMembersCount > 0
                  ? ` and ${additionalMembersCount} others`
                  : ''}
              </Text>
            </View>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleSelection(item.id, 'squad')}
              color="#096A2E"
            />
            <TouchableOpacity
              style={LAYOUT.expandButton}
              onPress={() => toggleSquadExpansion(item.id)}
            >
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#096A2E"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    // Handle squad member
    if (item.isSquadMember) {
      return (
        <View style={LAYOUT.memberStyle}>
          <List.Item
            title={item.name}
            description={item.email}
            left={() =>
              !item.profilePic ? (
                <Avatar.Text
                  size={36}
                  label={item.initials || '?'}
                  style={{ backgroundColor: '#ddd' }}
                  labelStyle={{ color: '#333' }}
                />
              ) : (
                <Avatar.Image
                  size={36}
                  source={{ uri: item.profilePic }}
                  style={{ backgroundColor: '#ddd' }}
                  labelStyle={{ color: '#333' }}
                />
              )
            }
          />
        </View>
      );
    }

    const isSelected = selectedItems.some(
      (selected) => selected.id === item.id && selected.type === 'friend',
    );

    return (
      <TouchableOpacity onPress={() => toggleSelection(item.id, 'friend')}>
        <View style={[styles.listItem, isSelected ? LAYOUT.selectedItem : {}]}>
          <View style={styles.listItemAvatar}>
            {!item.profilePic ? (
              <Avatar.Text
                size={40}
                label={item.initials || '?'}
                style={{ backgroundColor: '#fff' }}
                labelStyle={{ color: '#000' }}
              />
            ) : (
              <Avatar.Image
                size={40}
                source={{ uri: item.profilePic }}
                style={{ backgroundColor: '#fff' }}
                labelStyle={{ color: '#000' }}
              />
            )}
          </View>

          <View style={styles.listItemContent}>
            <Text>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>{item.email}</Text>
          </View>

          <View style={styles.listItemCheckbox}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleSelection(item.id, 'friend')}
              color="#096A2E"
              uncheckedColor="#096A2E"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav navigation={navigation} title="Schedule Meal" />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color="#096A2E" />
          <Text style={{ marginTop: 20 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopNav navigation={navigation} title="Schedule Meal" />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  if (!combinedData || combinedData.length === 0) {
    return (
      <View style={styles.container}>
        <TopNav navigation={navigation} title="Schedule Meal" />
        <Text style={styles.header}>SCHEDULE A MEAL</Text>
        <Text style={styles.subheader}>
          Select friends or squads to schedule a meal with.
        </Text>

        <View style={LAYOUT.emptyContainer}>
          <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
            You don't have any friends or squads yet. Add some friends first!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddFriendsScreen')}
            style={{ marginTop: 10 }}
          >
            Add Friends
          </Button>
        </View>
      </View>
    );
  }

  const allSelectedMembers = getAllSelectedMembers();

  // Get names of selected items for display
  const getSelectionText = () => {
    if (selectedItems.length === 0) return '';

    const friendCount = selectedItems.filter(
      (item) => item.type === 'friend',
    ).length;
    const squadCount = selectedItems.filter(
      (item) => item.type === 'squad',
    ).length;

    const parts = [];
    if (friendCount > 0) {
      parts.push(`${friendCount} friend${friendCount > 1 ? 's' : ''}`);
    }
    if (squadCount > 0) {
      parts.push(`${squadCount} squad${squadCount > 1 ? 's' : ''}`);
    }

    return parts.join(' and ');
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Schedule Meal" />

      <Text style={styles.header}>SCHEDULE A MEAL</Text>

      <Text style={styles.subheader}>
        Select friends or squads to schedule a meal with.
      </Text>

      <View style={LAYOUT.buttonRow}>
        <TouchableOpacity
          style={BUTTON_STYLES.dateTime}
          onPress={() => console.log('Date/Time pressed')}
        >
          <Text>Date/Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            BUTTON_STYLES.send,
            selectedItems.length === 0 ? { opacity: 0.5 } : {},
          ]}
          onPress={() => {
            if (selectedItems.length > 0) {
              console.log('Scheduling meal with:', allSelectedMembers);

              navigation.navigate('WhatNow', {
                message: `Meal scheduled with ${getSelectionText()}!`,
              });
            } else {
              console.log('Please select at least one friend or squad');
            }
          }}
          disabled={selectedItems.length === 0}
        >
          <Text style={BUTTON_STYLES.sendText}>Send</Text>
          <MaterialCommunityIcons name="send" size={24} color="#096A2E" />
        </TouchableOpacity>
      </View>

      <View style={[styles.listContainer, LAYOUT.listAdjustment]}>
        <FlatList
          data={getFlatListData()}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={LAYOUT.emptyContainer}>
              <Text>No friends or squads available</Text>
            </View>
          }
        />
      </View>

      <View style={[styles.bottomContainer, LAYOUT.bottomContainer]}>
        <TouchableOpacity
          style={[
            styles.pingButton,
            selectedItems.length === 0 ? { opacity: 0.5 } : {},
          ]}
          onPress={() => {
            if (selectedItems.length > 0) {
              console.log(
                'Scheduling immediate meal with:',
                allSelectedMembers,
              );

              navigation.navigate('WhatNow', {
                message: `Meal scheduled now with ${getSelectionText()}!`,
              });
            } else {
              console.log('Please select at least one friend or squad');
            }
          }}
          disabled={selectedItems.length === 0}
        >
          <Text style={styles.pingButtonLabel}>Schedule Meal Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
