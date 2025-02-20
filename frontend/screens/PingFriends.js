import React, { useState } from "react";
import { View, SectionList } from "react-native";
import { Button, List, Checkbox, Text } from "react-native-paper";
import styles from "../styles"; 
import TopNav from "../components/TopNav";

const friendsByLocation = [
  {
    title: "At FOCO",
    data: [
      { name: "Cha Krupka" },
      { name: "Nicole Ward" },
      { name: "Ski Patrol", group: true, members: ["Jason Gonzalez", "Elliot Krewson"] },
    ],
  },
  {
    title: "At Fern",
    data: [{ name: "Invictus", group: true, members: ["Harry Beesley-Gilman", "James Graft"] }],
  },
  {
    title: "At Hop",
    data: [{ name: "Club Ski" }],
  },
  {
    title: "At Collis",
    data: [{ name: "Person 4" }, { name: "Person 5" }],
  },
];

export default function PingFriends({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleSelection = (name) => {
    setSelectedFriends((prev) =>
      prev.includes(name) ? prev.filter((friend) => friend !== name) : [...prev, name]
    );
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Ping Friends" profilePic={profilePic} />

      <SectionList
        sections={friendsByLocation}
        keyExtractor={(item, index) => item.name + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <>
            <List.Item
              title={item.name}
              left={() => <List.Icon icon={item.group ? "account-group" : "account-circle"} />}
              right={() => (
                <Checkbox
                  status={selectedFriends.includes(item.name) ? "checked" : "unchecked"}
                  onPress={() => toggleSelection(item.name)}
                />
              )}
              onPress={() => toggleSelection(item.name)}
              style={[
                styles.listItem,
                selectedFriends.includes(item.name) ? { backgroundColor: "#74C69D" } : {},
              ]}
            />

            {item.group &&
              item.members.map((member, index) => (
                <List.Item
                  key={`${item.name}-member-${index}`}
                  title={`${member}`}
                  titleStyle={{ marginLeft: 30, color: "white" }} 
                  left={() => <List.Icon icon="account" />}
                />
              ))}
          </>
        )}
      />

      {selectedFriends.length > 0 && (
        <Button mode="contained" style={styles.button} onPress={() => console.log(`Pinging: ${selectedFriends}`)}>
          Ping Now
        </Button>
      )}
    </View>
  );
}
