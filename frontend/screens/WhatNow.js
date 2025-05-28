import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles';
import TopNav from '../components/TopNav';
import ActivePings from '../components/ActivePings';
import useStore from '../store';

export default function WhatNow({ navigation, route }) {
  const message = route.params?.message || null;
  const [showMessage, setShowMessage] = useState(!!message);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const logout = useStore((state) => state.userSlice.logout);

  // Get current user location from store
  const currentUser = useStore((state) => state.userSlice.currentUser);
  const userLocation = currentUser?.location || 'Not set';

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleLogoutConfirmation();
        return true; // Prevent default behavior
      },
    );

    return () => backHandler.remove();
  }, []);

  const formatLocation = (location) => {
    if (!location || location === 'Not set') return 'Not set';
    if (location === 'ghost') return 'Offline';

    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const toggleCategory = (categoryId) => {
    if (activeCategoryId === categoryId) {
      setActiveCategoryId(null);
    } else {
      setActiveCategoryId(categoryId);
    }
  };


  const mealOptions = [
    { id: 'pingFriends', label: 'Ping Friends Now', screen: 'PingFriends' },
    { id: 'StealAMeal', label: 'Steal a Meal', screen: 'StealAMeal' },

    {
      id: 'scheduleMeal',
      label: 'Schedule in Advance',
      screen: 'ScheduleMeal',
    },
    { id: 'viewMeals', label: 'View Your Meals', screen: 'ViewMeals' },
    { id: 'mealRequests', label: 'View Meal Requests', screen: 'MealRequests' },
  ];

  const friendOptions = [
    { id: 'buildSquad', label: 'Build a Squad', screen: 'BuildSquad' },
    { id: 'addFriends', label: 'Add Friends', screen: 'AddFriendsScreen' },
    {
      id: 'friendRequests',
      label: 'View Friend Requests',
      screen: 'FriendRequestsScreen',
    },
  ];

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="What Now?" />

      <ScrollView
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        {showMessage && (
          <View style={localStyles.messageCard}>
            <Text style={localStyles.messageText}>{message}</Text>
          </View>
        )}

        <ActivePings navigation={navigation} />

        <View style={localStyles.locationContainer}>
          <Text style={localStyles.locationLabel}>Your current location: </Text>
          <Text style={localStyles.locationValue}>
            {formatLocation(userLocation)}
          </Text>
          <TouchableOpacity
            style={localStyles.updateButton}
            onPress={() => navigation.navigate('SetLocation')}
          >
            <Text style={localStyles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </View>

        <Card style={localStyles.categoryCard}>
          <TouchableOpacity
            onPress={() => toggleCategory('meals')}
            activeOpacity={0.7}
          >
            <Card.Content style={localStyles.categoryHeader}>
              <View style={localStyles.headerLeft}>
                <MaterialCommunityIcons
                  name="food-fork-drink"
                  size={24}
                  color="#6750a4"
                />
                <Text style={localStyles.categoryTitle}>Meals</Text>
              </View>
              <MaterialCommunityIcons
                name={
                  activeCategoryId === 'meals' ? 'chevron-up' : 'chevron-down'
                }
                size={24}
                color="#6750a4"
              />
            </Card.Content>
          </TouchableOpacity>

          {activeCategoryId === 'meals' && (
            <View style={localStyles.optionsContainer}>
              <Divider style={localStyles.divider} />
              {mealOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={localStyles.optionButton}
                  onPress={() => navigation.navigate(option.screen)}
                >
                  <Text style={localStyles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        <Card style={localStyles.categoryCard}>
          <TouchableOpacity
            onPress={() => toggleCategory('friends')}
            activeOpacity={0.7}
          >
            <Card.Content style={localStyles.categoryHeader}>
              <View style={localStyles.headerLeft}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color="#6750a4"
                />
                <Text style={localStyles.categoryTitle}>Friends</Text>
              </View>
              <MaterialCommunityIcons
                name={
                  activeCategoryId === 'friends' ? 'chevron-up' : 'chevron-down'
                }
                size={24}
                color="#6750a4"
              />
            </Card.Content>
          </TouchableOpacity>

          {activeCategoryId === 'friends' && (
            <View style={localStyles.optionsContainer}>
              <Divider style={localStyles.divider} />
              {friendOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={localStyles.optionButton}
                  onPress={() => navigation.navigate(option.screen)}
                >
                  <Text style={localStyles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Campus Map Button - Always visible as a standalone card */}
        <Card style={localStyles.mapCard}>
          <TouchableOpacity
            style={localStyles.mapButton}
            onPress={() => navigation.navigate('CampusMap')}
          >
            <MaterialCommunityIcons name="map" size={20} color="#6750a4" />
            <Text style={localStyles.mapButtonText}>Campus Map</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + 40,
  },
  messageCard: {
    backgroundColor: '#e6f7e9',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  messageText: {
    color: '#096A2E',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%',
  },
  locationLabel: {
    fontSize: 16,
    color: '#666',
  },
  locationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750a4',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  updateButtonText: {
    color: '#6750a4',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#6750a4',
  },
  divider: {
    backgroundColor: '#E0E0E0',
    height: 1,
  },
  optionsContainer: {
    backgroundColor: '#f9f9f9',
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#6750a4',
  },
  mapCard: {
    marginTop: 5,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#6750a4',
    backgroundColor: '#f8f8ff',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750a4',
    marginLeft: 10,
  },
});
