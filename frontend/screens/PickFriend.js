import React, { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Checkbox, Text, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles";
import TopNav from "../components/TopNav";

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

// Constants
const BUTTON_STYLES = {
  dateTime: {
    width: 200,
    height: 34,
    borderRadius: 6,
    backgroundColor: "rgba(174,207,117,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  send: {
    width: 100,
    height: 52,
    backgroundColor: "rgba(174,207,117,0.75)",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  sendText: {
    color: "#096A2E",
    marginRight: 3,
  },
};

const LAYOUT = {
  buttonRow: {
    position: "absolute",
    top: 290,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 5,
    backgroundColor: "white",
    zIndex: 1,
  },
  listAdjustment: {
    top: 350,
    height: 520,
  },
  bottomContainer: {
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  memberStyle: {
    paddingLeft: 50,
  },
  selectedItem: {
    backgroundColor: "#74C69D",
  },
};

export default function PickFriend({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Toggle friend selection
  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  // Render individual friend or group item
  const renderFriend = ({ item }) => (
    <View>
      {/* Friend item */}
      <TouchableOpacity onPress={() => toggleSelection(item.id)}>
        <View
          style={[
            styles.listItem,
            selectedFriends.includes(item.id) ? LAYOUT.selectedItem : {},
          ]}
        >
          {/* Avatar */}
          <View style={styles.listItemAvatar}>
            <Avatar.Text
              size={40}
              label={item.name ? item.name.charAt(0).toUpperCase() : ""}
              style={{ backgroundColor: "#fff" }}
              labelStyle={{ color: "#000" }}
            />
          </View>

          {/* Name */}
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

      {/* Group members if this is a group */}
      {item.group &&
        item.members.map((member, index) => (
          <View
            key={`${item.id}-member-${index}`}
            style={[styles.listItem, LAYOUT.memberStyle]}
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
      {/* Top navigation bar */}
      <TopNav
        navigation={navigation}
        title="Ping Friends"
        profilePic={profilePic}
      />

      {/* Main header */}
      <Text style={styles.header}>PING YOUR FRIENDS</Text>

      {/* Subheader */}
      <Text style={styles.subheader}>Select friends and schedule a ping.</Text>

      {/* Date/Time and Send button row */}
      <View style={LAYOUT.buttonRow}>
        {/* Date/Time button */}
        <View style={BUTTON_STYLES.dateTime}>
          <Text>Date/Time</Text>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={BUTTON_STYLES.send}
          onPress={() => console.log("Send pressed")}
        >
          <Text style={BUTTON_STYLES.sendText}>Send</Text>
          <MaterialCommunityIcons name="send" size={24} color="#096A2E" />
        </TouchableOpacity>
      </View>

      {/* Friends list */}
      <View style={[styles.listContainer, LAYOUT.listAdjustment]}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      {/* Bottom button */}
      <View style={[styles.bottomContainer, LAYOUT.bottomContainer]}>
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
