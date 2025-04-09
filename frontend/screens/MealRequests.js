import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
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
} from 'react-native-paper';
import TopNav from '../components/TopNav';
import useStore from '../store';
import styles from '../styles';

export default function MealRequests({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [loading, setLoading] = useState(true);
  const [mealRequests, setMealRequests] = useState([]);
  const [hostedMeals, setHostedMeals] = useState([]);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const getAllMeals = useStore((state) => state.mealSlice.getAllMeals);
  const updateMeal = useStore((state) => state.mealSlice.updateMeal);

  useEffect(() => {
    const loadMeals = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const meals = await getAllMeals();
        console.log('Loaded meals:', JSON.stringify(meals, null, 2));

        if (!meals || !Array.isArray(meals)) {
          console.error('Unexpected meals response:', meals);
          throw new Error('Invalid meals data received');
        }

        const requests = meals.filter(
          (meal) =>
            meal.participants &&
            meal.participants.some(
              (p) =>
                p.userID &&
                (p.userID._id === currentUser._id ||
                  p.userID === currentUser._id ||
                  (typeof p.userID === 'string' &&
                    p.userID === currentUser.userID)) &&
                p.status === 'invited',
            ),
        );

        // Filter meals where current user is host
        const hosted = meals.filter(
          (meal) =>
            meal.host &&
            // Check MongoDB ObjectId match
            ((typeof meal.host === 'object' &&
              meal.host._id === currentUser._id) ||
              (typeof meal.host === 'string' && meal.host === currentUser._id)),
        );

        console.log('Filtered requests:', requests.length);
        console.log('Filtered hosted meals:', hosted.length);

        setMealRequests(requests);
        setHostedMeals(hosted);
      } catch (error) {
        console.error('Error loading meals:', error);
        Alert.alert(
          'Error',
          'Failed to load meal requests: ' + (error.message || 'Unknown error'),
        );
      } finally {
        setLoading(false);
      }
    };

    loadMeals();
  }, [currentUser, getAllMeals]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getParticipantMongoId = (meal) => {
    const participant = meal.participants.find(
      (p) =>
        (p.userID && p.userID._id === currentUser._id) ||
        (p.userID && p.userID === currentUser._id) ||
        (typeof p.userID === 'string' && p.userID === currentUser.userID),
    );

    if (!participant) return null;

    if (participant._id) return participant._id;
    return participant;
  };

  const handleMealResponse = async (mealId, action) => {
    try {
      setLoading(true);

      const meal = mealRequests.find((m) => m._id === mealId);
      if (!meal) {
        throw new Error('Meal not found');
      }

      const participantToUpdate = meal.participants.find(
        (p) =>
          (p.userID && p.userID._id === currentUser._id) ||
          (p.userID && p.userID === currentUser._id) ||
          (typeof p.userID === 'string' && p.userID === currentUser.userID),
      );

      if (!participantToUpdate) {
        throw new Error('Participant not found in meal');
      }

      const updatedParticipants = meal.participants.map((p) => {
        if (
          (p.userID && p.userID._id === currentUser._id) ||
          (p.userID && p.userID === currentUser._id) ||
          (typeof p.userID === 'string' && p.userID === currentUser.userID)
        ) {
          return {
            ...p,
            status: action === 'accept' ? 'confirmed' : 'declined',
          };
        }
        return p;
      });

      console.log('Updating meal with new participants:', updatedParticipants);

      await updateMeal(mealId, { participants: updatedParticipants });

      setMealRequests((prev) => prev.filter((m) => m._id !== mealId));

      Alert.alert(
        'Success',
        `You have ${
          action === 'accept' ? 'accepted' : 'declined'
        } the meal invitation`,
      );
    } catch (error) {
      console.error(`Error ${action}ing meal:`, error);
      Alert.alert(
        'Error',
        `Failed to ${action} meal: ${error.message || 'Please try again'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const getHostName = (meal) => {
    if (!meal.host) return 'Unknown Host';

    if (typeof meal.host === 'object') {
      return meal.host.firstName && meal.host.lastName
        ? `${meal.host.firstName} ${meal.host.lastName}`
        : 'Unknown Host';
    }

    if (meal.host === currentUser._id) {
      return 'You (Host)';
    }

    return 'Unknown Host';
  };

  const getParticipantName = (participant) => {
    if (!participant || !participant.userID) return 'Unknown';

    if (typeof participant.userID === 'object') {
      return participant.userID.firstName && participant.userID.lastName
        ? `${participant.userID.firstName} ${participant.userID.lastName}`
        : 'Unknown';
    }

    if (
      participant.userID === currentUser._id ||
      participant.userID === currentUser.userID
    ) {
      return 'You';
    }

    return 'Unknown Participant';
  };

  const renderMealRequest = ({ item }) => (
    <Card style={localStyles.card}>
      <Card.Content>
        <Text style={localStyles.cardTitle}>
          {item.mealName || 'Meal Invitation'}
        </Text>
        <Divider style={localStyles.divider} />

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>Host:</Text>
          <Text style={localStyles.value}>{getHostName(item)}</Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>When:</Text>
          <Text style={localStyles.value}>
            {formatDate(item.date)} {item.time && `at ${item.time}`}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>Location:</Text>
          <Text style={localStyles.value}>
            {item.location || 'Not specified'}
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
                const name = getParticipantName(p);

                let statusColor = '#999';
                if (p.status === 'confirmed') statusColor = '#4CAF50';
                if (p.status === 'declined') statusColor = '#F44336';

                return (
                  <Chip
                    key={p._id || (p.userID && (p.userID._id || p.userID))}
                    style={[localStyles.chip, { borderColor: statusColor }]}
                    textStyle={{ color: name === 'You' ? '#5C4D7D' : '#333' }}
                  >
                    {name} {p.status !== 'invited' ? `(${p.status})` : ''}
                  </Chip>
                );
              })}
          </View>
        </View>
      </Card.Content>

      <Card.Actions style={localStyles.cardActions}>
        <Button
          mode="contained"
          onPress={() => handleMealResponse(item._id, 'accept')}
          style={[localStyles.actionButton, localStyles.acceptButton]}
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleMealResponse(item._id, 'decline')}
          style={[localStyles.actionButton, localStyles.declineButton]}
        >
          Decline
        </Button>
      </Card.Actions>
    </Card>
  );

  // Render a hosted meal item
  const renderHostedMeal = ({ item }) => (
    <Card style={localStyles.card}>
      <Card.Content>
        <Text style={localStyles.cardTitle}>
          {item.mealName || 'Your Hosted Meal'}
        </Text>
        <Divider style={localStyles.divider} />

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>When:</Text>
          <Text style={localStyles.value}>
            {formatDate(item.date)} {item.time && `at ${item.time}`}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>Location:</Text>
          <Text style={localStyles.value}>
            {item.location || 'Not specified'}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={localStyles.label}>Meal Type:</Text>
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
                const name = getParticipantName(p);

                let statusColor = '#999';
                if (p.status === 'confirmed') statusColor = '#4CAF50';
                if (p.status === 'declined') statusColor = '#F44336';

                return (
                  <Chip
                    key={p._id || (p.userID && (p.userID._id || p.userID))}
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

  if (loading) {
    return (
      <View style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Meal Requests"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#5C4D7D" />
          <Text style={localStyles.loadingText}>Loading meal requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Meal Requests"
        profilePic={profilePic}
      />
      <View style={{ height: 50 }} />

      <View style={styles.content}>
        <Text style={localStyles.sectionTitle}>Pending Invitations</Text>
        {mealRequests.length > 0 ? (
          <FlatList
            data={mealRequests}
            renderItem={renderMealRequest}
            keyExtractor={(item) => item._id}
            style={localStyles.list}
            contentContainerStyle={localStyles.listContent}
          />
        ) : (
          <Text style={localStyles.emptyMessage}>
            You don't have any pending meal invitations
          </Text>
        )}

        <Divider style={localStyles.sectionDivider} />

        <Text style={localStyles.sectionTitle}>Your Hosted Meals</Text>
        {hostedMeals.length > 0 ? (
          <FlatList
            data={hostedMeals}
            renderItem={renderHostedMeal}
            keyExtractor={(item) => item._id}
            style={localStyles.list}
            contentContainerStyle={localStyles.listContent}
          />
        ) : (
          <Text style={localStyles.emptyMessage}>
            You haven't hosted any meals yet
          </Text>
        )}

        <View style={localStyles.buttonContainer}>
          <Button
            mode="contained"
            style={localStyles.scheduleButton}
            onPress={() => navigation.navigate('ScheduleMeal', { profilePic })}
          >
            Schedule New Meal
          </Button>

          <Button
            mode="outlined"
            style={localStyles.viewButton}
            onPress={() => navigation.navigate('ViewMeals', { profilePic })}
          >
            View All Meals
          </Button>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#5C4D7D',
  },
  sectionDivider: {
    marginVertical: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
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
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  actionButton: {
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#5C4D7D',
  },
  declineButton: {
    borderColor: '#F44336',
    color: '#F44336',
  },
  list: {
    width: '100%',
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: 10,
  },
  emptyMessage: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575',
  },
  loadingText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#5C4D7D',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  scheduleButton: {
    backgroundColor: '#5C4D7D',
    paddingVertical: 6,
    marginBottom: 10,
  },
  viewButton: {
    borderColor: '#5C4D7D',
    paddingVertical: 6,
  },
});
