// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import { HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import Starter from './screens/Starter';
import Login from './screens/Login';
import CreateAccount from './screens/CreateAccount';
import SetLocation from './screens/SetLocation';
import ViewMeals from './screens/ViewMeals';
import WhatNow from './screens/WhatNow';
import ScheduleMeal from './screens/ScheduleMeal';
import PingFriends from './screens/PingFriends';
import PickFriend from './screens/PickFriend';
import MealRequests from './screens/MealRequests';

import BuildSquad from './screens/BuildSquad';
import CampusMap from './screens/CampusMap';
import EnterAvailability from './screens/EnterAvailability';
import AddFriendsScreen from './screens/AddFriendsScreen';
import FriendRequestsScreen from './screens/FriendRequestsScreen';

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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Starter" component={Starter} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} />
        <Stack.Screen name="WhatNow" component={WhatNow} />
        <Stack.Screen name="ScheduleMeal" component={ScheduleMeal} />
        <Stack.Screen name="PingFriends" component={PingFriends} />
        <Stack.Screen name="PickFriend" component={PickFriend} />
        <Stack.Screen name="BuildSquad" component={BuildSquad} />
        <Stack.Screen name="CampusMap" component={CampusMap} />
        <Stack.Screen name="MealRequests" component={MealRequests} />
        <Stack.Screen name="SetLocation" component={SetLocation} />
        <Stack.Screen name="ViewMeals" component={ViewMeals} />
        <Stack.Screen name="EnterAvailability" component={EnterAvailability} />
        <Stack.Screen name="AddFriendsScreen" component={AddFriendsScreen} />
        <Stack.Screen
          name="FriendRequestsScreen"
          component={FriendRequestsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
