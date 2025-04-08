import React, { useState, useEffect } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';
import MapMarker from '../components/MapMarker';

export default function CampusMap({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [loading, setLoading] = useState(true);
  const [friendsByLocation, setFriendsByLocation] = useState({});

  const currentUser = useStore((state) => state.userSlice.currentUser);

  const locationCoordinates = {
    foco: { latitude: 43.7030422, longitude: -72.2909885 },
    collis: { latitude: 43.7027412, longitude: -72.2900297 },
    hop: { latitude: 43.7016, longitude: -72.2881 },
    fern: { latitude: 43.70488, longitude: -72.294709 },
    novack: { latitude: 43.7057, longitude: -72.2887 },
    ghost: null,
  };

  const locationNames = {
    foco: 'Class of 1953 Commons (FOCO)',
    collis: 'Collis Center',
    hop: 'Hopkins Center (HOP)',
    fern: 'Fern Coffee & Tea',
    novack: 'Novack Cafe',
    ghost: 'Offline',
  };

  const normalizeLocationKey = (location) => {
    if (!location) return null;

    const lowerCase = location.toLowerCase();

    if (
      lowerCase === 'hop' ||
      lowerCase === 'hopkins' ||
      lowerCase === 'hopkinscenter'
    ) {
      return 'hop';
    }

    if (
      lowerCase === 'foco' ||
      lowerCase === 'commons' ||
      lowerCase === '1953commons'
    ) {
      return 'foco';
    }

    if (lowerCase === 'collis' || lowerCase === 'colliscenter') {
      return 'collis';
    }

    if (lowerCase === 'fern' || lowerCase === 'ferncoffee') {
      return 'fern';
    }

    if (lowerCase === 'novack' || lowerCase === 'novackcafe') {
      return 'novack';
    }

    return lowerCase;
  };

  useEffect(() => {
    const loadFriendLocations = async () => {
      if (!currentUser || !currentUser.friendsList || !currentUser.idToken) {
        setLoading(false);
        return;
      }

      try {
        const locationGroups = {};

        for (const friend of currentUser.friendsList) {
          try {
            const details = await fetchFriendDetails(
              currentUser.idToken,
              friend.friendID,
            );

            if (!details || !details.location || details.location === 'ghost') {
              continue;
            }
            
            let isLocationExpired = true;
            if (details.locationUpdatedAt) {
              const timestamp = new Date(details.locationUpdatedAt);
              if (!isNaN(timestamp.getTime())) {
                const ageInMinutes = (new Date() - timestamp) / (1000 * 60);
                isLocationExpired = ageInMinutes >= 90;
              }
            } else if (details.updatedAt) {
              const timestamp = new Date(details.updatedAt);
              if (!isNaN(timestamp.getTime())) {
                const ageInMinutes = (new Date() - timestamp) / (1000 * 60);
                isLocationExpired = ageInMinutes >= 90;
              }
            }
            
            if (isLocationExpired) {
              continue;
            }

            const locationKey = normalizeLocationKey(details.location);

            if (!locationKey || !locationCoordinates[locationKey]) {
              continue;
            }

            if (!locationGroups[locationKey]) {
              locationGroups[locationKey] = {
                coordinate: locationCoordinates[locationKey],
                locationName: locationNames[locationKey] || locationKey,
                friends: [],
              };
            }

            locationGroups[locationKey].friends.push({
              id: friend.friendID,
              name:
                `${details.firstName || ''} ${details.lastName || ''}`.trim() ||
                'Unknown',
              initials:
                `${details.firstName?.charAt(0) || ''}${
                  details.lastName?.charAt(0) || ''
                }`.toUpperCase() || '??',
            });
          } catch (error) {
            console.error(`Error processing friend ${friend.friendID}:`, error);
          }
        }

        if (currentUser.location && currentUser.location !== 'ghost') {
          // Check if current user's location is expired (more than 90 minutes old)
          let isLocationExpired = true;
          if (currentUser.locationUpdatedAt) {
            const timestamp = new Date(currentUser.locationUpdatedAt);
            if (!isNaN(timestamp.getTime())) {
              const ageInMinutes = (new Date() - timestamp) / (1000 * 60);
              isLocationExpired = ageInMinutes >= 90;
            }
          } else if (currentUser.updatedAt) {
            // Fallback to updatedAt if locationUpdatedAt is missing
            const timestamp = new Date(currentUser.updatedAt);
            if (!isNaN(timestamp.getTime())) {
              const ageInMinutes = (new Date() - timestamp) / (1000 * 60);
              isLocationExpired = ageInMinutes >= 90;
            }
          }
          
          // Skip if location is expired
          if (!isLocationExpired) {
            const locationKey = normalizeLocationKey(currentUser.location);

            if (locationKey && locationCoordinates[locationKey]) {
              if (!locationGroups[locationKey]) {
                locationGroups[locationKey] = {
                  coordinate: locationCoordinates[locationKey],
                  locationName: locationNames[locationKey] || locationKey,
                  friends: [],
                };
            }

              locationGroups[locationKey].friends.push({
                id: 'current-user',
                name:
                  `${currentUser.firstName || ''} ${
                    currentUser.lastName || ''
                  } (You)`.trim() || 'You',
                initials:
                  `${currentUser.firstName?.charAt(0) || ''}${
                    currentUser.lastName?.charAt(0) || ''
                  }`.toUpperCase() || 'YU',
              });
            }
          }
        }

        setFriendsByLocation(locationGroups);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendLocations();
  }, [currentUser]);

  const getOffsetPositions = (count) => {
    const baseDistance = 0.00025;

    const patterns = {
      1: [{ lat: 0, lng: 0 }],
      2: [
        { lat: baseDistance, lng: 0 },
        { lat: -baseDistance, lng: 0 },
      ],
      3: [
        { lat: 0, lng: -baseDistance },
        { lat: baseDistance * 0.866, lng: baseDistance * 0.5 },
        { lat: -baseDistance * 0.866, lng: baseDistance * 0.5 },
      ],
      4: [
        { lat: baseDistance, lng: 0 },
        { lat: 0, lng: baseDistance },
        { lat: -baseDistance, lng: 0 },
        { lat: 0, lng: -baseDistance },
      ],
      5: [
        { lat: baseDistance, lng: 0 },
        { lat: baseDistance * 0.588, lng: baseDistance * 0.809 },
        { lat: -baseDistance * 0.588, lng: baseDistance * 0.809 },
        { lat: -baseDistance * 0.588, lng: -baseDistance * 0.809 },
        { lat: baseDistance * 0.588, lng: -baseDistance * 0.809 },
      ],
      6: [
        { lat: baseDistance, lng: 0 },
        { lat: baseDistance * 0.5, lng: baseDistance * 0.866 },
        { lat: -baseDistance * 0.5, lng: baseDistance * 0.866 },
        { lat: -baseDistance, lng: 0 },
        { lat: -baseDistance * 0.5, lng: -baseDistance * 0.866 },
        { lat: baseDistance * 0.5, lng: -baseDistance * 0.866 },
      ],
    };

    if (patterns[count]) {
      return patterns[count];
    }

    return Array(count)
      .fill(0)
      .map((_, i) => {
        const angle = (2 * Math.PI * i) / count;
        return {
          lat: Math.sin(angle) * baseDistance,
          lng: Math.cos(angle) * baseDistance,
        };
      });
  };

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Campus Map"
        profilePic={profilePic}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#096A2E" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 43.7044,
            longitude: -72.2887,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          mapType="hybrid"
        >
          <Marker
            coordinate={locationCoordinates.foco}
            title="Class of 1953 Commons (FOCO)"
            pinColor="#5C4D7D"
          />
          <Marker
            coordinate={locationCoordinates.collis}
            title="Collis Center"
            pinColor="#5C4D7D"
          />
          <Marker
            coordinate={locationCoordinates.hop}
            title="Hopkins Center (HOP)"
            pinColor="#5C4D7D"
          />
          <Marker
            coordinate={locationCoordinates.fern}
            title="Fern Coffee & Tea"
            pinColor="#5C4D7D"
          />
          <Marker
            coordinate={locationCoordinates.novack}
            title="Novack Cafe"
            pinColor="#5C4D7D"
          />

          {Object.keys(friendsByLocation).map((locationKey) => {
            const locationGroup = friendsByLocation[locationKey];
            const baseCoordinate = locationGroup.coordinate;
            const friendCount = locationGroup.friends.length;

            const offsetPositions = getOffsetPositions(friendCount);

            const mainMarkerTitle = `${
              locationGroup.locationName
            } (${friendCount} ${friendCount === 1 ? 'person' : 'people'})`;
            const mainMarkerDescription = locationGroup.friends
              .map((f) => f.name)
              .join('\n');

            return (
              <React.Fragment key={locationKey}>
                <Marker
                  coordinate={baseCoordinate}
                  title={mainMarkerTitle}
                  description={mainMarkerDescription}
                  pinColor="green"
                >
                  <View style={styles.countBubble}>
                    <Text style={styles.countText}>{friendCount}</Text>
                  </View>
                </Marker>

                {locationGroup.friends.map((friend, index) => {
                  const offset = offsetPositions[index] || { lat: 0, lng: 0 };
                  const coordinate = {
                    latitude: baseCoordinate.latitude + offset.lat,
                    longitude: baseCoordinate.longitude + offset.lng,
                  };

                  return (
                    <Marker
                      key={`${locationKey}-${friend.id}`}
                      coordinate={coordinate}
                      title={friend.name}
                      description={`At ${locationGroup.locationName}`}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View
                        style={[
                          styles.initialsBubble,
                          friend.id === 'current-user'
                            ? styles.currentUserBubble
                            : null,
                        ]}
                      >
                        <Text style={styles.initialsText}>
                          {friend.initials}
                        </Text>
                      </View>
                    </Marker>
                  );
                })}
              </React.Fragment>
            );
          })}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  countBubble: {
    backgroundColor: '#096A2E',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  initialsBubble: {
    backgroundColor: '#5C4D7D',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  currentUserBubble: {
    backgroundColor: '#096A2E',
  },
  initialsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
