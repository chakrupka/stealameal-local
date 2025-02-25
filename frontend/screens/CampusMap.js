import React from 'react';
import MapView, {Marker} from 'react-native-maps';
import { View } from 'react-native';
import {IconButton, Text} from "react-native-paper";
import styles from "../styles";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import MapMarker from "../components/MapMarker";
import TopNav from "../components/TopNav"

export default function CampusMap({ navigation }) {
    return (
        <View style={styles.mapContainer}>
            <TopNav navigation={navigation} title="Campus Map"/>
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
                <MapMarker lat={43.7057} long={-72.2887} initials="EK" />
                <MapMarker lat={43.7030422} long={-72.2909885} initials="CK" />
                <MapMarker lat={43.7027412} long={-72.2900297} initials="NW" />
                <MapMarker lat={43.7016} long={-72.2881} initials="JG" />
            </MapView>
        </View>

    );
}