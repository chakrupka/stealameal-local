import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import TopNav from '../components/TopNav';
import { useLocation } from '../contexts/LocationContext';
import LocationToggle from '../components/LocationToggle';
import useStore from '../store';

export default function LocationSettings({ navigation }) {
  const { locationEnabled, hasPermission, isTracking, requestPermissions } =
    useLocation();

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const [loading, setLoading] = useState(false);

  const getLastUpdateTime = () => {
    if (!currentUser?.locationUpdatedAt) return 'Never updated';

    try {
      const date = new Date(currentUser.locationUpdatedAt);
      if (isNaN(date.getTime())) return 'Unknown';

      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return 'Error parsing date';
    }
  };

  const handleRequestPermissions = async () => {
    setLoading(true);
    try {
      const granted = await requestPermissions();
      if (granted) {
        Alert.alert('Success', 'Location permissions granted');
      } else {
        Alert.alert(
          'Permission Required',
          'Location permissions are needed to share your location. Please enable location permissions in your device settings.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <TopNav navigation={navigation} title="Location Settings" />

      <ScrollView
        style={localStyles.scrollView}
        contentContainerStyle={localStyles.scrollViewContent}
      >
        <View style={localStyles.contentContainer}>
          <Text style={localStyles.headerText}></Text>
          <Card style={localStyles.card}>
            <Card.Content>
              <Text style={localStyles.sectionTitle}>Share My Location</Text>
              <Text style={localStyles.description}>
                When enabled, your friends can see where you are on campus. Your
                location will be visible for 90 minutes after each update.
              </Text>

              <LocationToggle />

              <Divider style={localStyles.divider} />

              <Text style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>Status: </Text>
                <Text
                  style={
                    isTracking
                      ? localStyles.activeStatus
                      : localStyles.inactiveStatus
                  }
                >
                  {isTracking ? 'Active' : 'Inactive'}
                </Text>
              </Text>

              <Text style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>Last updated: </Text>
                {getLastUpdateTime()}
              </Text>

              <Text style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>Current location: </Text>
                {currentUser?.location && currentUser.location !== 'ghost'
                  ? currentUser.location
                  : 'Not sharing'}
              </Text>

              <Text style={localStyles.infoItem}>
                <Text style={localStyles.infoLabel}>Permission status: </Text>
                {hasPermission ? 'Granted' : 'Not granted'}
              </Text>
            </Card.Content>
          </Card>
          <Card style={localStyles.card}>
            <Card.Content>
              <Text style={localStyles.sectionTitle}>Location Permissions</Text>
              <Text style={localStyles.description}>
                Location permissions are required to share your location with
                friends.
              </Text>

              <Button
                mode="outlined"
                onPress={handleRequestPermissions}
                loading={loading}
                disabled={loading || hasPermission}
                style={localStyles.button}
                labelStyle={localStyles.requestButtonText}
              >
                {hasPermission
                  ? 'Permissions Already Granted'
                  : 'Request Location Permissions'}
              </Button>
            </Card.Content>
          </Card>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('SetLocation')}
            style={localStyles.updateLocationButton}
            labelStyle={localStyles.locationButtonText}
          >
            Update My Location
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  infoItem: {
    marginBottom: 8,
    fontSize: 16,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  activeStatus: {
    color: 'green',
    fontWeight: 'bold',
  },
  inactiveStatus: {
    color: '#999',
  },
  button: {
    borderRadius: 15,
    marginTop: 8,
  },
  updateLocationButton: {
    borderRadius: 15,
    padding: 4,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: 500,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: 600,
  },
});
