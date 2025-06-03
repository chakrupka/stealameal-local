import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import useStore from '../store';
import styles, { BOX_SHADOW } from '../styles';

export default function StealAMeal({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const { openMeals, openMealsLoading } = useStore((state) => state.mealSlice);
  const getOpenMeals = useStore((state) => state.mealSlice.getOpenMeals);
  const joinOpenMeal = useStore((state) => state.mealSlice.joinOpenMeal);

  useEffect(() => {
    if (currentUser) {
      loadOpenMeals();
    }
  }, [currentUser]);

  const loadOpenMeals = async () => {
    try {
      await getOpenMeals();
    } catch (error) {
      console.error('Error loading open meals:', error);
      Alert.alert('Error', 'Failed to load available meals');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOpenMeals();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinMeal = async (meal) => {
    Alert.alert(
      'Join Meal',
      `Join "${meal.mealName}" hosted by ${getHostName(meal)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: async () => {
            try {
              const result = await joinOpenMeal(meal._id);
              Alert.alert(
                'Success!',
                `You've joined "${meal.mealName}"! The host will be notified.`,
                [
                  {
                    text: 'View My Meals',
                    onPress: () => navigation.navigate('ViewMeals'),
                  },
                  {
                    text: 'OK',
                  },
                ],
              );
            } catch (error) {
              console.error('Error joining meal:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error ||
                  'Failed to join meal. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';

    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getHostName = (meal) => {
    if (!meal.host) return 'Unknown Host';

    if (typeof meal.host === 'object') {
      return meal.host.firstName && meal.host.lastName
        ? `${meal.host.firstName} ${meal.host.lastName}`
        : 'Unknown Host';
    }

    return 'Unknown Host';
  };

  const getParticipantCount = (meal) => {
    const confirmedCount = meal.participants.filter(
      (p) => p.status === 'confirmed',
    ).length;
    return confirmedCount + 1; // +1 for host
  };

  // Group meals by day
  const groupMealsByDay = () => {
    const grouped = {};

    openMeals.forEach((meal) => {
      const day = formatDate(meal.date);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(meal);
    });

    // Sort meals within each day by time
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return grouped;
  };

  const mealsByDay = groupMealsByDay();
  const days = Object.keys(mealsByDay).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  const renderMealItem = ({ item }) => (
    <Card style={localStyles.mealCard}>
      <Card.Content>
        <View style={localStyles.mealHeader}>
          <Text style={localStyles.mealTitle}>{item.mealName}</Text>
          <Chip
            style={[localStyles.mealTypeChip, getMealTypeStyle(item.mealType)]}
            textStyle={localStyles.mealTypeText}
          >
            {item.mealType?.charAt(0).toUpperCase() + item.mealType?.slice(1)}
          </Chip>
        </View>

        <Divider style={localStyles.divider} />

        <View style={localStyles.mealInfo}>
          <View style={localStyles.infoRow}>
            <MaterialCommunityIcons name="account" size={16} color="#666" />
            <Text style={localStyles.infoText}>
              Hosted by {getHostName(item)}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <MaterialCommunityIcons name="clock" size={16} color="#666" />
            <Text style={localStyles.infoText}>{formatTime(item.time)}</Text>
          </View>

          <View style={localStyles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            <Text style={localStyles.infoText}>{item.location}</Text>
          </View>

          <View style={localStyles.infoRow}>
            <MaterialCommunityIcons
              name="account-group"
              size={16}
              color="#666"
            />
            <Text style={localStyles.infoText}>
              {getParticipantCount(item)} people going
            </Text>
          </View>

          {item.notes && (
            <View style={localStyles.notesSection}>
              <Text style={localStyles.notesLabel}>Notes:</Text>
              <Text style={localStyles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </Card.Content>

      <Card.Actions style={localStyles.cardActions}>
        <Button
          mode="contained"
          onPress={() => handleJoinMeal(item)}
          style={localStyles.joinButton}
          icon="plus"
        >
          Steal This Meal!
        </Button>
      </Card.Actions>
    </Card>
  );

  const getMealTypeStyle = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return { backgroundColor: '#fff3e0' };
      case 'lunch':
        return { backgroundColor: '#e8f5e8' };
      case 'dinner':
        return { backgroundColor: '#f3e5f5' };
      default:
        return { backgroundColor: '#f5f5f5' };
    }
  };

  const renderDaySection = (day) => (
    <View key={day} style={localStyles.daySection}>
      <TouchableOpacity
        style={localStyles.dayHeader}
        onPress={() => setSelectedDay(selectedDay === day ? null : day)}
      >
        <Text style={localStyles.dayTitle}>{day}</Text>
        <View style={localStyles.dayHeaderRight}>
          <Text style={localStyles.mealCount}>
            {mealsByDay[day].length} meal
            {mealsByDay[day].length !== 1 ? 's' : ''}
          </Text>
          <MaterialCommunityIcons
            name={selectedDay === day ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#6750a4"
          />
        </View>
      </TouchableOpacity>

      {(selectedDay === day || selectedDay === null) && (
        <FlatList
          data={mealsByDay[day]}
          renderItem={renderMealItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={localStyles.mealsContainer}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const totalMeals = openMeals.length;

  if (openMealsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav navigation={navigation} title="Steal a Meal" />
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#6750a4" />
          <Text style={localStyles.loadingText}>
            Finding meals you can steal...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav navigation={navigation} title="Steal a Meal" />
      <View style={localStyles.content}>
        {totalMeals > 0 ? (
          <FlatList
            data={days}
            renderItem={({ item }) => renderDaySection(item)}
            keyExtractor={(item) => item}
            style={localStyles.daysList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={localStyles.emptyContainer}>
            <MaterialCommunityIcons
              name="food-off"
              size={64}
              color="#ccc"
              style={localStyles.emptyIcon}
            />
            <Text style={localStyles.emptyTitle}>No meals to steal</Text>
            <Text style={localStyles.emptyMessage}>
              Your friends haven't posted any open meals this week.
            </Text>
            <Text style={localStyles.emptyHint}>
              Tell them to mark their meals as "Open to Join" when scheduling!
            </Text>

            <Button
              mode="outlined"
              onPress={onRefresh}
              style={localStyles.refreshButton}
              icon="refresh"
            >
              Check Again
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6750a4',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750a4',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  mealCounter: {
    fontSize: 12,
    color: '#6750a4',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  daySection: {
    marginBottom: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e8f5e8',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  mealsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mealCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  mealTypeChip: {
    marginLeft: 8,
  },
  mealTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 12,
  },
  mealInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  notesSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  cardActions: {
    justifyContent: 'center',
    paddingTop: 8,
  },
  joinButton: {
    backgroundColor: '#6750a4',
    ...BOX_SHADOW,
  },
  daysList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  refreshButton: {
    marginTop: 16,
    borderRadius: 15,
  },
});
