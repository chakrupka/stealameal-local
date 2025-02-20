import React from "react";
import { View, Image } from "react-native";
import { Button, Text } from "react-native-paper";
import styles from "../styles";

export default function Starter({ navigation }) {
  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.largeLogo} />

      <Text style={styles.title}>Dine with Friends</Text>

      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("Login")}>
          Log in
        </Button>
        <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("CreateAccount")}>
          Create Account
        </Button>
      </View>
    </View>
  );
}
