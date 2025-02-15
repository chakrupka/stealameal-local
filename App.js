import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import { HammersmithOne_400Regular } from "@expo-google-fonts/hammersmith-one";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans";
import Starter from "./screens/Starter";
import Login from "./screens/Login";
import CreateAccount from "./screens/CreateAccount";
import WhatNow from "./screens/WhatNow";
import ScheduleMeal from "./screens/ScheduleMeal";
import PingFriends from "./screens/PingFriends";
import PickFriend from "./screens/PickFriend";
import BuildSquad from "./screens/BuildSquad";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } } from "expo-status-bar";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
