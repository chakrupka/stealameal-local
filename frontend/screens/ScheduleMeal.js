import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';

export default function ScheduleMeal({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [friends, setFriends] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const userSquads = useStore((state) => state.squadSlice.squads);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);

  // Load friends and squads
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load squads if needed
        if ((!userSquads || userSquads.length === 0) && currentUser?.userID) {
          await getUserSquads(currentUser.userID);
        }

        // Process friends
        if (currentUser?.friendsList && currentUser.friendsList.length > 0) {
          const friendsData = await Promise.all(
            currentUser.friendsList.map(async (friend) => {
              try {
                const details = await fetchFriendDetails(
                  currentUser.idToken,
                  friend.friendID,
                );

                return {
                  id: friend.friendID,
                  name: `${details.firstName} ${details.lastName}`,
                  email: details.email,
                  type: 'friend',
                  initials: `${details.firstName.charAt(
                    0,
                  )}${details.lastName.charAt(0)}`.toUpperCase(),
                };
              } catch (error) {
                console.error('Error fetching friend details:', error);
                return {
                  id: friend.friendID,
                  name: 'Unknown Friend',
                  email: 'Unknown',
                  type: 'friend',
                  initials: '??',
                };
              }
            }),
          );
          setFriends(friendsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, getUserSquads, userSquads]);

  const toggleSelection = (id, type) => {
    setSelectedItems((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev.filter((item) => item.id !== id);
      }
      return [...prev, { id, type }];
    });
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        localStyles.friendItem,
        selectedItems.some((selected) => selected.id === item.id) &&
          localStyles.selectedItem,
      ]}
      onPress={() => toggleSelection(item.id, item.type)}
    >
      <View style={localStyles.avatarContainer}>
        <Avatar.Text
          size={50}
          label={item.initials}
          style={localStyles.avatar}
        />
      </View>
      <View style={localStyles.friendInfo}>
        <Text style={localStyles.friendName}>{item.name}</Text>
        <Text style={localStyles.friendEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Schedule Meal"
        profilePic={profilePic}
      />

      <View style={localStyles.contentContainer}>
        <View style={localStyles.headerContainer}>
          <Text style={localStyles.headerText}>MEAL</Text>
        </View>

        <Text style={localStyles.subheaderText}>
          Select friends or squads to schedule a meal with.
        </Text>

        <View style={localStyles.actionButtonsContainer}>
          <TouchableOpacity style={localStyles.dateTimeButton}>
            <Text style={localStyles.dateTimeText}>Date/Time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.sendButton,
              selectedItems.length === 0 && localStyles.disabledButton,
            ]}
            disabled={selectedItems.length === 0}
          >
            <Text style={localStyles.sendText}>Send</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#5C4D7D"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          style={localStyles.friendsList}
          contentContainerStyle={localStyles.friendsListContent}
        />
      </View>

      <View style={localStyles.bottomButton}>
        <TouchableOpacity style={localStyles.scheduleNowButton}>
          <Text style={localStyles.scheduleNowText}>Schedule Meal Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 5, 
  },
  headerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    alignItems: 'center',
    marginBottom: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '400',
  },
  subheaderText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15, 
    paddingHorizontal: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10, 
    width: '100%',
  },
  dateTimeButton: {
    backgroundColor: '#CBDBA7',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#E8F5D9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 16,
    color: '#5C4D7D',
    marginRight: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  friendsList: {
    flex: 1,
    width: '100%',
  },
  friendsListContent: {
    paddingHorizontal: 0,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBDBA7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedItem: {
    backgroundColor: '#A4C67D',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    backgroundColor: 'white',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
    color: '#555',
  },
  bottomButton: {
    width: '100%',
    backgroundColor: '#CBDBA7',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  scheduleNowButton: {
    paddingVertical: 5,
  },
  scheduleNowText: {
    fontSize: 16,
    color: '#5C4D7D',
  },
});
