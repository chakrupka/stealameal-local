import React, { useState } from "react";
import { View, FlatList } from "react-native";
import { Button, List, Checkbox, Text } from "react-native-paper";
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
];

export default function BuildSquad({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Build a Squad" profilePic={profilePic} />

      <FlatList
        data={dummyFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            left={() => <List.Icon icon="account-circle" />}
            right={() => (
              <Checkbox
                status={selectedFriends.includes(item.id) ? "checked" : "unchecked"}
                onPress={() => toggleSelection(item.id)}
              />
            )}
            onPress={() => toggleSelection(item.id)}
            style={[
              styles.listItem,
              selectedFriends.includes(item.id) ? { backgroundColor: "#74C69D" } : {},
            ]}
          />
        )}
      />

      {selectedFriends.length > 0 && (
        <Button mode="contained" style={styles.button} onPress={() => console.log(`Squad Created: ${selectedFriends}`)}>
          Confirm Squad
        </Button>
      )}
    </View>
  );
}
