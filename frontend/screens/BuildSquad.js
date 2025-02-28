import React, { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Checkbox, Text, Avatar, TextInput } from "react-native-paper";
import styles from "../styles";
import TopNav from "../components/TopNav";

const dummyFriends = [
  { id: "1", name: "Cha Krupka" },
  { id: "2", name: "Nicole Ward" },
  { id: "3", name: "Jason Gonzalez" },
  { id: "4", name: "Elliot Krewson" },
  { id: "5", name: "Harry Beesley-Gilman" },
  { id: "6", name: "James Graft" },
  { id: "7", name: "Club Ski" },
  { id: "8", name: "Person 4" },
  { id: "9", name: "Person 5" },
  { id: "10", name: "Person 6" },
  { id: "11", name: "Person 7" },
  { id: "12", name: "Person 8" },
  { id: "13", name: "Person 9" },
];

// Constants
const LAYOUT = {
  listAdjustment: {
    top: 300,
  },
  bottomContainer: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    width: "100%",
    left: 0,
    right: 30,
    bottom: 30,
  },
  selectedItem: {
    backgroundColor: "#74C69D",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  inputContainer: {
    flex: 1,
    marginRight: 15,
    width: "60%",
  },
  inputStyle: {
    backgroundColor: "white",
  },
};

export default function BuildSquad({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [squadName, setSquadName] = useState("");

  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity onPress={() => toggleSelection(item.id)}>
      <View
        style={[
          styles.listItem,
          selectedFriends.includes(item.id) ? LAYOUT.selectedItem : {},
        ]}
      >
        <View style={styles.listItemAvatar}>
          <Avatar.Text
            size={40}
            label={item.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: "#fff" }}
            labelStyle={{ color: "#000" }}
          />
        </View>

        <View style={styles.listItemContent}>
          <Text>{item.name}</Text>
        </View>

        <View style={styles.listItemCheckbox}>
          <Checkbox
            status={selectedFriends.includes(item.id) ? "checked" : "unchecked"}
            onPress={() => toggleSelection(item.id)}
            color="#096A2E"
            uncheckedColor="#096A2E"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const isSquadValid = selectedFriends.length > 0 && squadName.trim() !== "";

  return (
    <View style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Build a Squad"
        profilePic={profilePic}
      />

      <Text style={styles.header}>BUILD YOUR SQUAD</Text>

      <Text style={styles.subheader}>
        Click on friends to make a new group.
      </Text>

      <View style={[styles.listContainer, LAYOUT.listAdjustment]}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      <View style={[styles.bottomContainer, LAYOUT.bottomContainer]}>
        {/* Squad name input */}
        <View style={LAYOUT.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Enter squad name"
            value={squadName}
            onChangeText={setSquadName}
            style={LAYOUT.inputStyle}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.pingButton,
            !isSquadValid ? LAYOUT.disabledButton : {},
          ]}
          disabled={!isSquadValid}
          onPress={() =>
            console.log(
              `Squad "${squadName}" created with friends: ${selectedFriends}`
            )
          }
        >
          <Text style={styles.pingButtonLabel}>Create Squad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
