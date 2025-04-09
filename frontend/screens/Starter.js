import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import styles from '../styles';

export default function Starter({ navigation }) {
  return (
    <View style={[styles.container, styles.starterScreenContainer]}>
      <Image
        source={require('../assets/intrologo.png')}
        style={styles.starterBackgroundImage}
        resizeMode="contain"
      />

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Login')}
      >
        <Button
          mode="contained"
          style={[styles.starterAuthButton, { marginTop: 30 }]}
          labelStyle={styles.starterButtonText}
        >
          Log in
        </Button>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('CreateAccount')}
      >
        <Button
          mode="contained"
          style={[styles.starterAuthButton, { marginBottom: 100 }]}
          labelStyle={styles.starterButtonText}
        >
          Create Account
        </Button>
      </TouchableOpacity>

      <Image
        source={require('../assets/raccoon.png')}
        style={styles.starterRaccoonImage}
        resizeMode="contain"
      />

      <Image
        source={require('../assets/hamburger.png')}
        style={styles.starterHamburgerImage}
        resizeMode="contain"
      />
    </View>
  );
}
