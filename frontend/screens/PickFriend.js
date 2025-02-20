import React, { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Checkbox, Text, IconButton, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles";

const dummyFriends = [
  {
    id: "group1",
    name: "Ski Patrol",
    group: true,
    members: ["Jason Gonzalez", "Elliot Krewson"],
  },
  {
    id: "group2",
    name: "Invictus",
    group: true,
    members: ["Harry Beesley-Gilman", "James Graft"],
  },
  { id: "1", name: "Cha Krupka" },
  { id: "2", name: "Nicole Ward" },
  { id: "7", name: "Club Ski" },
  { id: "8", name: "Person 4" },
  { id: "9", name: "Person 5" },
];

export default function PickFriend({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const renderFriend = ({ item }) => (
    <View>
      <TouchableOpacity onPress={() => toggleSelection(item.id)}>
        <View style={styles.listItem}>
          {/* Contact Avator */}
          <View style={styles.listItemAvatar}>
            <Avatar.Text
              size={40}
              label={item.name ? item.name.charAt(0).toUpperCase() : ""}
              style={{ backgroundColor: "#fff" }}
              labelStyle={{ color: "#000" }}
            />
          </View>
          {/* Contact name */}
          <View style={styles.listItemContent}>
            <Text>{item.name}</Text>
          </View>
          {/* Checkbox */}
          <View style={styles.listItemCheckbox}>
            <Checkbox
              status={
                selectedFriends.includes(item.id) ? "checked" : "unchecked"
              }
              onPress={() => toggleSelection(item.id)}
              color="#096A2E"
              uncheckedColor="#096A2E"
              style={{ borderRadius: 0 }}
            />
          </View>
        </View>
      </TouchableOpacity>
      {/* For group items, list members underneath */}
      {item.group &&
        item.members.map((member, index) => (
          <View
            key={`${item.id}-member-${index}`}
            style={[styles.listItem, { paddingLeft: 50 }]}
          >
            <View style={styles.listItemAvatar}>
              <Avatar.Text
                size={40}
                label={member.charAt(0).toUpperCase()}
                style={{ backgroundColor: "#fff" }}
                labelStyle={{ color: "#000" }}
              />
            </View>
            <View style={styles.listItemContent}>
              <Text style={{ color: "white" }}>{member}</Text>
            </View>
          </View>
        ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.header}>PING YOUR FRIENDS</Text>

      {/* SUBHEADER */}
      <Text style={styles.subheader}>Select friends and schedule a ping.</Text>

      {/* Date/Time area */}
      <View style={styles.dateTimeContainer}>
        <Text>Date/Time</Text>
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => console.log("Send pressed")}
      >
        <Text style={{ color: "#096A2E", marginRight: 3 }}>Send</Text>
        <MaterialCommunityIcons
          name="send"
          size={24}
          color="#096A2E"
          style={styles.sendIcon}
        />
      </TouchableOpacity>

      {/* List container */}
      <View style={styles.listContainer}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
        />
      </View>

      {/* Back arrow and “Ping Friends Now” button */}
      <View style={styles.bottomContainer}>
        <IconButton
          icon={() => (
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          )}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <TouchableOpacity
          style={styles.pingButton}
          onPress={() => console.log("Ping Friends Now pressed")}
        >
          <Text style={styles.pingButtonLabel}>Ping Friends Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
