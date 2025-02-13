import React, { useState } from "react";
import { View, FlatList } from "react-native";
import { Button, List, Checkbox, Text } from "react-native-paper";
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


export default function PickFriend({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Pick a Friend" profilePic={profilePic} />

      <View style={styles.content}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <>
              <List.Item
                title={item.name}
                left={() => (
                  <List.Icon icon={item.group ? "account-group" : "account-circle"} />
                )}
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

              {item.group &&
                item.members.map((member, index) => (
                  <List.Item
                    key={`${item.id}-member-${index}`}
                    title={`${member}`}
                    titleStyle={{ marginLeft: 30, color: "white" }}
                    left={() => <List.Icon icon="account" />}
                  />
                ))}
            </>
          )}
        />

        {selectedFriends.length > 0 && (
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => console.log(`Selected Friends: ${selectedFriends}`)}
          >
            Confirm Selection
          </Button>
        )}
      </View>
    </View>
  );
}
