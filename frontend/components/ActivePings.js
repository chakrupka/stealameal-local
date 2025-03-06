import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import {
  getActivePings,
  respondToPing,
  dismissPing,
} from '../services/ping-api';

export default function ActivePings({ navigation }) {
  const [activePings, setActivePings] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const [lastChecked, setLastChecked] = useState(null);

  // Initial load of pings when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser?.idToken) {
      loadActivePings();
      setLastChecked(new Date());
    }
  }, [currentUser]);

  // More frequent polling for new pings (every 4 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (currentUser?.idToken) {
        loadActivePings();
        setLastChecked(new Date());
      }
    }, 4000);

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  // Handle focus events to refresh pings when screen comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser?.idToken) {
        loadActivePings();
        setLastChecked(new Date());
      }
    };

    // Subscribe to focus events
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', handleFocus);
      return unsubscribe;
    }

    return undefined;
  }, [navigation, currentUser]);

  const loadActivePings = async (force = false) => {
    try {
      // Avoid setting loading state for frequent background refreshes
      const isInitialLoad = !lastChecked;
      if (isInitialLoad || force) {
        setLoading(true);
      }

      const pings = await getActivePings(currentUser.idToken);
      setActivePings(pings);
    } catch (error) {
      console.error('Error loading pings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePingResponse = async (pingId, response) => {
    try {
      setLoading(true);
      await respondToPing(currentUser.idToken, pingId, response);

      if (response === 'accept') {
        Alert.alert('Success', 'You accepted the invitation!');
      } else {
        Alert.alert('Declined', 'You declined the invitation.');
      }

      setActivePings((prevPings) =>
        prevPings.filter((ping) => ping._id !== pingId),
      );
    } catch (error) {
      console.error(`Error ${response}ing ping:`, error);
      Alert.alert('Error', `Failed to ${response} ping.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissPing = async (pingId) => {
    try {
      setLoading(true);
      await dismissPing(currentUser.idToken, pingId);

      setActivePings((prevPings) =>
        prevPings.filter((ping) => ping._id !== pingId),
      );
    } catch (error) {
      console.error('Error dismissing ping:', error);
      Alert.alert('Error', 'Failed to dismiss ping.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;

    if (diffMs <= 0) {
      return 'Expired';
    }

    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'Less than a minute';
    } else if (diffMinutes === 1) {
      return '1 minute';
    } else {
      return `${diffMinutes} minutes`;
    }
  };

  // If there are no active pings, we just return null so nothing is rendered
  if (!activePings || activePings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Ping Notifications</Text>
        <TouchableOpacity
          onPress={() => loadActivePings(true)}
          style={styles.refreshButton}
          disabled={loading}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#5C4D7D" />
        </TouchableOpacity>
      </View>

      {activePings.map((ping) => (
        <Card key={ping._id} style={styles.pingCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.senderInfo}>
                <Avatar.Text
                  size={36}
                  label={ping.senderName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.senderName}>{ping.senderName}</Text>
                  <Text style={styles.timeRemaining}>
                    Expires in: {getTimeRemaining(ping.expiresAt)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDismissPing(ping._id)}
                style={styles.dismissButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.message}>{ping.message}</Text>

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => handlePingResponse(ping._id, 'accept')}
                style={styles.acceptButton}
                loading={loading}
                disabled={loading}
              >
                Accept
              </Button>
              <Button
                mode="outlined"
                onPress={() => handlePingResponse(ping._id, 'decline')}
                style={styles.declineButton}
                loading={loading}
                disabled={loading}
              >
                Decline
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4D7D',
  },
  refreshButton: {
    padding: 5,
  },
  pingCard: {
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 10,
    backgroundColor: '#CBDBA7',
  },
  senderName: {
    fontWeight: 'bold',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#777',
  },
  dismissButton: {
    padding: 5,
  },
  message: {
    fontSize: 16,
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  acceptButton: {
    marginRight: 10,
    backgroundColor: '#5C4D7D',
  },
  declineButton: {
    borderColor: '#f44336',
  },
});
