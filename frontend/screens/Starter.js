import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BOX_SHADOW } from '../styles';

export default function Starter({ navigation }) {
  return (
    <LinearGradient
      colors={['#E9E6FF', '#6750A4']}
      start={{ x: 0, y: 1.5 }}
      end={{ x: 0, y: 0 }}
      style={localStyles.root}
    >
      <View style={localStyles.content}>
        <Text style={localStyles.header}>STEAL A MEAL</Text>
        <Text style={localStyles.subheader}>Dine with friends</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Login')}
        >
          <Button
            mode="contained"
            style={localStyles.authButton}
            labelStyle={localStyles.buttonLabel}
            contentStyle={localStyles.buttonContent}
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
            style={[localStyles.authButton, { marginTop: 16 }]}
            labelStyle={localStyles.buttonLabel}
            contentStyle={localStyles.buttonContent}
          >
            Create Account
          </Button>
        </TouchableOpacity>

        {/* <Image
          source={require('../assets/raccoon-logo.png')}
          style={localStyles.raccoon}
          resizeMode="contain"
        /> */}
      </View>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  authButton: {
    backgroundColor: '#e9e6ff',
    width: 268,
    borderRadius: 10,
    ...BOX_SHADOW,
  },
  buttonLabel: {
    fontSize: 18,
    color: 'rgb(58, 58, 58)',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  raccoon: {
    position: 'absolute',
    bottom: 60,
    left: 50,
    width: 120,
    height: 120,
  },
  header: {
    fontSize: 47,
    fontWeight: '900',
  },
  subheader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 30,
  },
});
