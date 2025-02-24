import React, { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Button, Checkbox, Text, Avatar, TextInput } from "react-native-paper";
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
          selectedFriends.includes(item.id)
            ? { backgroundColor: "#74C69D" }
            : {},
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

  // Enable/disable button
  const isSquadValid = selectedFriends.length > 0 && squadName.trim() !== "";

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <TopNav
        navigation={navigation}
        title="Build a Squad"
        profilePic={profilePic}
      />

      {/* Header */}
      <Text
        style={[
          styles.header,
          {
            marginTop: 50,
            textAlign: "center",
          },
        ]}
      >
        Build Your Squad
      </Text>

      {/* Friend Selection List */}
      <View style={{ flex: 1, marginTop: 20 }}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          ListHeaderComponent={<View style={{ height: 150 }} />}
          contentContainerStyle={{ paddingBottom: 150 }}
          showsVerticalScrollIndicator={true}
        />
      </View>

      {/* Bottom Fixed Input & Confirm Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: 40,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <TextInput
          mode="outlined"
          placeholder="Enter squad name"
          value={squadName}
          onChangeText={setSquadName}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <Button
          mode="contained"
          disabled={!isSquadValid}
          style={{
            backgroundColor: isSquadValid ? "#74C69D" : "#ccc",
          }}
          onPress={() =>
            console.log(
              `Squad "${squadName}" created with friends: ${selectedFriends}`
            )
          }
        >
          Confirm Squad
        </Button>
      </View>
    </View>
  );
}
