// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import { HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { LocationProvider } from './contexts/LocationContext';

import Starter from './screens/Starter';
import Login from './screens/Login';
import StealAMeal from './screens/StealAMeal';

import CreateAccount from './screens/CreateAccount';
import SetLocation from './screens/SetLocation';
import ViewMeals from './screens/ViewMeals';
import WhatNow from './screens/WhatNow';
import ScheduleMeal from './screens/ScheduleMeal';
import PingFriends from './screens/PingFriends';
import PickFriend from './screens/PickFriend';
import MealRequests from './screens/MealRequests';
import EnterAvailability from './screens/EnterAvailability';

import BuildSquad from './screens/BuildSquad';
import CampusMap from './screens/CampusMap';
import AddFriendsScreen from './screens/AddFriendsScreen';
import FriendRequestsScreen from './screens/FriendRequestsScreen';
import Profile from './screens/Profile';
import LocationSettings from './screens/LocationSettings';
import CalendarView from './screens/CalendarView';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        HammersmithOne_400Regular,
        DMSans_400Regular,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <LocationProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Starter" component={Starter} />
          <Stack.Screen
            name="EnterAvailability"
            component={EnterAvailability}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="CreateAccount" component={CreateAccount} />
          <Stack.Screen name="WhatNow" component={WhatNow} />
          <Stack.Screen name="ScheduleMeal" component={ScheduleMeal} />
          <Stack.Screen name="StealAMeal" component={StealAMeal} />

          <Stack.Screen name="PingFriends" component={PingFriends} />
          <Stack.Screen name="PickFriend" component={PickFriend} />
          <Stack.Screen name="BuildSquad" component={BuildSquad} />
          <Stack.Screen name="CampusMap" component={CampusMap} />
          <Stack.Screen name="MealRequests" component={MealRequests} />
          <Stack.Screen name="SetLocation" component={SetLocation} />
          <Stack.Screen name="ViewMeals" component={ViewMeals} />
          <Stack.Screen name="LocationSettings" component={LocationSettings} />

          <Stack.Screen name="AddFriendsScreen" component={AddFriendsScreen} />
          <Stack.Screen
            name="FriendRequestsScreen"
            component={FriendRequestsScreen}
          />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="CalendarView" component={CalendarView} />
        </Stack.Navigator>
      </NavigationContainer>
    </LocationProvider>
  );
}
