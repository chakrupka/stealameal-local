import React from 'react';
import MapView, {Marker} from 'react-native-maps';
import { View } from 'react-native';
import {IconButton, Text} from "react-native-paper";
import styles from "../styles";
import {MaterialCommunityIcons} from "@expo/vector-icons";

export default function MapMarker({ lat, long, initials }) {
    return (
        <Marker coordinate={{ latitude: lat, longitude: long }}>
            <View style={styles.marker}>
                <Text style={styles.initials}>{initials}</Text>
            </View>
        </Marker>
    );
}