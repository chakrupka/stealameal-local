import React from 'react';
import { View, Image } from 'react-native';
import { Button } from 'react-native-paper';
import styles from '../styles';

export default function Starter({ navigation }) {
  return (
    <View style={[styles.container, styles.starterScreenContainer]}>
      <Image
        source={require('../assets/intrologo.png')}
        style={styles.starterBackgroundImage}
        resizeMode="cover"
      />

      <View style={styles.starterLoginButtonContainer}>
        <Button
          mode="contained"
          style={styles.starterAuthButton}
          labelStyle={styles.starterButtonText}
          onPress={() => navigation.navigate('Login')}
        >
          Log in
        </Button>
      </View>

      <View style={styles.starterCreateAccountButtonContainer}>
        <Button
          mode="contained"
          style={styles.starterAuthButton}
          labelStyle={styles.starterButtonText}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          Create Account
        </Button>
      </View>

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
