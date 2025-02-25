import React from 'react';
import MapView, {Marker} from 'react-native-maps';
import { View } from 'react-native';
import {IconButton, Text} from "react-native-paper";
import styles from "../styles";
import {MaterialCommunityIcons} from "@expo/vector-icons";

export default function CampusMap({ navigation }) {
    return (
        <View style={styles.mapContainer}>
            <IconButton
                icon={() => (
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
                )}
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            />
            <Text style={styles.subheader}>Campus Map</Text>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 43.7057, // Dartmouth College Latitude
                    longitude: -72.2887, // Dartmouth College Longitude
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                mapType={"hybrid"}
            >
                <Marker coordinate={{ latitude: 43.7057, longitude: -72.2887 }}>
                    <View style={styles.marker}>
                        <Text style={styles.initials}>EK</Text>
                    </View>
                </Marker>
            </MapView>
        </View>

    );
}