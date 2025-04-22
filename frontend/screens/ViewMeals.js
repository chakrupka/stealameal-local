import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
  Chip,
  Searchbar,
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import useStore from '../store';
import styles from '../styles';

export default function ViewMeals({ navigation, route }) {
  const reloadMeals = route.params?.reloadMeals || false;

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const getAllMeals = useStore((state) => state.mealSlice.getAllMeals);
  const deleteMeal = useStore((state) => state.mealSlice.deleteMeal);
  
  useEffect(() => {
    loadMeals();
  }, [currentUser, reloadMeals]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (currentUser) {
        loadMeals(false);
        setLastRefreshTime(new Date());
      }
    }, 6000);

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        loadMeals();
      }
    });

    return unsubscribe;
  }, [navigation, currentUser]);

  const loadMeals = async (showLoading = true) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      const allMeals = await getAllMeals();

      if (!allMeals || !Array.isArray(allMeals)) {
        throw new Error('Invalid meals data received');
      }

      const relevantMeals = allMeals.filter(
        (meal) =>
          (meal.host &&
            ((typeof meal.host === 'object' &&
              meal.host._id === currentUser._id) ||
              (typeof meal.host === 'string' &&
                meal.host === currentUser._id))) ||
          (meal.participants &&
            meal.participants.some(
              (p) =>
                p.userID &&
                (p.userID._id === currentUser._id ||
                  p.userID === currentUser._id ||
                  (typeof p.userID === 'string' &&
                    p.userID === currentUser.userID)),
            )),
      );

      relevantMeals.sort((a, b) => new Date(b.date) - new Date(a.date));

      setMeals(relevantMeals);
      applyFilters(relevantMeals, filter, searchQuery);
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert(
        'Error',
        'Failed to load meals: ' + (error.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (mealsToFilter, activeFilter, query) => {
    let result = [...mealsToFilter];

    switch (activeFilter) {
      case 'hosting':
        result = result.filter(
          (meal) =>
            meal.host &&
            ((typeof meal.host === 'object' &&
              meal.host._id === currentUser._id) ||
              (typeof meal.host === 'string' && meal.host === currentUser._id)),
        );
        break;
      case 'attending':
        result = result.filter(
          (meal) =>
            meal.participants &&
            meal.participants.some(
              (p) =>
                p.userID &&
                (p.userID._id === currentUser._id ||
                  p.userID === currentUser._id ||
                  (typeof p.userID === 'string' &&
                    p.userID === currentUser.userID)) &&
                p.status === 'confirmed',
            ),
        );
        break;
      case 'past':
        result = result.filter((meal) => new Date(meal.date) < new Date());
        break;
      case 'upcoming':
        result = result.filter((meal) => new Date(meal.date) >= new Date());
        break;
      default:
        break;
    }

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(
        (meal) =>
          (meal.mealName &&
            meal.mealName.toLowerCase().includes(lowercaseQuery)) ||
          (meal.location &&
            meal.location.toLowerCase().includes(lowercaseQuery)) ||
          (meal.notes && meal.notes.toLowerCase().includes(lowercaseQuery)),
      );
    }

    setFilteredMeals(result);
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    applyFilters(meals, filter, query);
  };

  const setActiveFilter = (newFilter) => {
    setFilter(newFilter);
    applyFilters(meals, newFilter, searchQuery);
    setMenuVisible(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getFormattedDateTime = (date, time) => {
    if (!date) return 'No date specified';

    let result = formatDate(date);

    if (time) {
      result += ` at ${time}`;
    }

    if (new Date(date) < new Date()) {
      result += ' (Past)';
    }

    return result;
  };

  const isUserHost = (meal) => {
    return (
      meal.host &&
      ((typeof meal.host === 'object' && meal.host._id === currentUser._id) ||
        (typeof meal.host === 'string' && meal.host === currentUser._id))
    );
  };

  const getUserStatus = (meal) => {
    if (isUserHost(meal)) return 'host';

    const participant =
      meal.participants &&
      meal.participants.find(
        (p) =>
          p.userID &&
          (p.userID._id === currentUser._id ||
            p.userID === currentUser._id ||
            (typeof p.userID === 'string' && p.userID === currentUser.userID)),
      );

    return participant ? participant.status : 'unknown';
  };

  const getHostName = (meal) => {
    if (!meal.host) return 'Unknown Host';

    if (typeof meal.host === 'object') {
      return meal.host.firstName && meal.host.lastName
        ? `${meal.host.firstName} ${meal.host.lastName}`
        : 'Unknown Host';
    }

    if (meal.host === currentUser._id) {
      return 'You';
    }

    return 'Unknown Host';
  };

  const handleDeleteMeal = async (mealId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this meal? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteMeal(mealId);

              setMeals((prev) => prev.filter((m) => m._id !== mealId));
              setFilteredMeals((prev) => prev.filter((m) => m._id !== mealId));

              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert(
                'Error',
                'Failed to delete meal: ' +
                  (error.message || 'Please try again'),
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const getMealStatusColor = (meal) => {
    if (new Date(meal.date) < new Date()) {
      return { backgroundColor: '#f5f5f5', borderLeftColor: '#9e9e9e' };
    }

    const status = getUserStatus(meal);

    switch (status) {
      case 'host':
        return { backgroundColor: '#e3f2fd', borderLeftColor: '#2196f3' };
      case 'confirmed':
        return { backgroundColor: '#e8f5e9', borderLeftColor: '#4caf50' };
      case 'invited':
        return { backgroundColor: '#fff9c4', borderLeftColor: '#fbc02d' };
      case 'declined':
        return { backgroundColor: '#ffebee', borderLeftColor: '#f44336' };
      default:
        return { backgroundColor: 'white', borderLeftColor: '#9e9e9e' };
    }
  };

  const renderMealItem = ({ item }) => {
    const statusColor = getMealStatusColor(item);
    const userStatus = getUserStatus(item);
    const isPastMeal = new Date(item.date) < new Date();

    return (
      
      <Card style={[localStyles.card, statusColor, { borderLeftWidth: 4 }]}>
        <Card.Content>
          <View style={localStyles.cardHeader}>
            <Text style={localStyles.cardTitle}>
              {item.mealName || 'Unnamed Meal'}
            </Text>
            {isUserHost(item) && !isPastMeal && (
              <TouchableOpacity onPress={() => handleDeleteMeal(item._id)}>
                <MaterialCommunityIcons
                  name="delete"
                  size={20}
                  color="#f44336"
                />
              </TouchableOpacity>
            )}
          </View>

          <Divider style={localStyles.divider} />

          <View style={localStyles.infoRow}>
            <Text style={localStyles.label}>Status:</Text>
            <Text
              style={[
                localStyles.value,
                userStatus === 'host' && localStyles.hostText,
                userStatus === 'confirmed' && localStyles.confirmedText,
                userStatus === 'invited' && localStyles.invitedText,
                userStatus === 'declined' && localStyles.declinedText,
                isPastMeal && localStyles.pastText,
              ]}
            >
              {isPastMeal
                ? 'Past meal'
                : userStatus === 'host'
                ? 'You are hosting'
                : userStatus === 'confirmed'
                ? 'You are attending'
                : userStatus === 'invited'
                ? 'Invitation pending'
                : userStatus === 'declined'
                ? 'You declined'
                : 'Unknown status'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.label}>Host:</Text>
            <Text style={localStyles.value}>{getHostName(item)}</Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.label}>When:</Text>
            <Text style={localStyles.value}>
              {getFormattedDateTime(item.date, item.time)}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.label}>Location:</Text>
            <Text style={localStyles.value}>
              {item.location || 'Not specified'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={localStyles.label}>Type:</Text>
            <Text style={localStyles.value}>
              {item.mealType
                ? item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)
                : 'Not specified'}
            </Text>
          </View>

          {item.notes && (
            <View style={localStyles.notesSection}>
              <Text style={localStyles.label}>Notes:</Text>
              <Text style={localStyles.notes}>{item.notes}</Text>
            </View>
          )}

          <View style={localStyles.attendeesSection}>
            <Text style={localStyles.label}>Attendees:</Text>
            <View style={localStyles.chipContainer}>
              {item.participants &&
                item.participants.map((p) => {
                  let name = 'Unknown';
                  if (p.userID) {
                    if (typeof p.userID === 'object') {
                      name =
                        p.userID.firstName && p.userID.lastName
                          ? `${p.userID.firstName} ${p.userID.lastName}`
                          : 'Unknown';
                    } else if (
                      p.userID === currentUser._id ||
                      p.userID === currentUser.userID
                    ) {
                      name = 'You';
                    }
                  }

                  let statusColor = '#999';
                  if (p.status === 'confirmed') statusColor = '#4CAF50';
                  if (p.status === 'declined') statusColor = '#F44336';
                  if (p.status === 'invited') statusColor = '#FFC107';

                  const participantKey =
                    p._id ||
                    (p.userID &&
                      typeof p.userID === 'object' &&
                      p.userID._id) ||
                    p.userID ||
                    Math.random().toString();

                  return (
                    <Chip
                      key={participantKey}
                      style={[localStyles.chip, { borderColor: statusColor }]}
                    >
                      {name} ({p.status})
                    </Chip>
                  );
                })}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav navigation={navigation} title="All Meals" />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#5C4D7D" />
          <Text style={localStyles.loadingText}>Loading meals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="All Meals" />
      <View style={{ height: 50 }} />
      <View style={styles.content}>
        <View style={localStyles.searchContainer}>
          <Searchbar
            placeholder="Search meals"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={localStyles.searchBar}
          />

          <TouchableOpacity
            style={localStyles.filterButton}
            onPress={() => setMenuVisible(true)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color="#5C4D7D"
            />
          </TouchableOpacity>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<View />}
            style={localStyles.menu}
          >
            <Menu.Item
              onPress={() => setActiveFilter('all')}
              title="All Meals"
              titleStyle={filter === 'all' ? localStyles.activeFilter : null}
            />
            <Menu.Item
              onPress={() => setActiveFilter('hosting')}
              title="Hosting"
              titleStyle={
                filter === 'hosting' ? localStyles.activeFilter : null
              }
            />
            <Menu.Item
              onPress={() => setActiveFilter('attending')}
              title="Attending"
              titleStyle={
                filter === 'attending' ? localStyles.activeFilter : null
              }
            />
            <Menu.Item
              onPress={() => setActiveFilter('upcoming')}
              title="Upcoming"
              titleStyle={
                filter === 'upcoming' ? localStyles.activeFilter : null
              }
            />
            <Menu.Item
              onPress={() => setActiveFilter('past')}
              title="Past"
              titleStyle={filter === 'past' ? localStyles.activeFilter : null}
            />
          </Menu>
        </View>

        <View style={localStyles.filterChipsContainer}>
          <Text style={localStyles.filterLabel}>Filter: </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                localStyles.filterChip,
                filter === 'all' && localStyles.activeChip,
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={filter === 'all' ? localStyles.activeChipText : null}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.filterChip,
                filter === 'hosting' && localStyles.activeChip,
              ]}
              onPress={() => setActiveFilter('hosting')}
            >
              <Text
                style={filter === 'hosting' ? localStyles.activeChipText : null}
              >
                Hosting
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.filterChip,
                filter === 'attending' && localStyles.activeChip,
              ]}
              onPress={() => setActiveFilter('attending')}
            >
              <Text
                style={
                  filter === 'attending' ? localStyles.activeChipText : null
                }
              >
                Attending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.filterChip,
                filter === 'upcoming' && localStyles.activeChip,
              ]}
              onPress={() => setActiveFilter('upcoming')}
            >
              <Text
                style={
                  filter === 'upcoming' ? localStyles.activeChipText : null
                }
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.filterChip,
                filter === 'past' && localStyles.activeChip,
              ]}
              onPress={() => setActiveFilter('past')}
            >
              <Text
                style={filter === 'past' ? localStyles.activeChipText : null}
              >
                Past
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {filteredMeals.length > 0 ? (
          <FlatList
            data={filteredMeals}
            renderItem={renderMealItem}
            keyExtractor={(item) => item._id}
            style={localStyles.list}
            contentContainerStyle={localStyles.listContent}
          />
        ) : (
          <View style={localStyles.emptyContainer}>
            {meals.length > 0 ? (
              <Text style={localStyles.emptyMessage}>
                No meals matching the current filters.
              </Text>
            ) : (
              <View>
                <Text style={localStyles.emptyMessage}>
                  You don't have any meals scheduled.
                </Text>
                <Text style={localStyles.emptySubMessage}>
                  Start by scheduling a meal with your friends!
                </Text>
              </View>
            )}
          </View>
        )}

        <Button
          mode="outlined"
          style={[localStyles.calendarButton, localStyles.button]}
          onPress={() => navigation.navigate('ScheduleMeal')}
          icon="calendar"
        >
          View Calendar 
        </Button>
        <Button
          mode="contained"
          style={localStyles.scheduleButton}
          onPress={() => navigation.navigate('ScheduleMeal')}
        >
          Schedule New Meal
        </Button>
        
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  menu: {
    marginTop: 45,
    marginLeft: -120,
  },
  activeFilter: {
    color: '#5C4D7D',
    fontWeight: 'bold',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  filterChip: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  activeChip: {
    backgroundColor: '#5C4D7D',
  },
  activeChipText: {
    color: 'white',
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C4D7D',
    marginBottom: 5,
  },
  divider: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
    minWidth: 70,
  },
  value: {
    flex: 1,
  },
  hostText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  confirmedText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  invitedText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  declinedText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  pastText: {
    color: '#9e9e9e',
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 5,
    marginBottom: 10,
  },
  notes: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  attendeesSection: {
    marginTop: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  chip: {
    margin: 3,
    borderWidth: 1,
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#757575',
  },
  emptySubMessage: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#757575',
  },
  loadingText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#5C4D7D',
  },
  scheduleButton: {
    marginVertical: 20,
    backgroundColor: '#5C4D7D',
    paddingVertical: 6,
  },
  calendarButton: {
    borderColor: '#5C4D7D',
    paddingVertical: 6,
  },
});
