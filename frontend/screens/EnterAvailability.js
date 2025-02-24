import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Button } from "react-native";
import styles from "../styles";
import TopNav from "../components/TopNav";

const txt = "Click this text to create or edit an activity. \nPlease input the information as follows: \n \nActivity Name, Time, Duration \n";

export default function EnterAvailability({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;

  const scheduleOptions = ["Classes", "Sporting", "Extracurricular", "Other"];
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openDropdown2, setOpenDropdown2] = useState(null);
  const [visibleActivities, setVisibleActivities] = useState(null); // Track when to show saved activities
  const [activityInput, setActivityInput] = useState("");
  const [savedActivities, setSavedActivities] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Toggle category selection (closes activity list)
  const toggleDropdown = (index) => {
    if (openDropdown === index) {
      setOpenDropdown(null);
      setVisibleActivities(null); // Hide saved activities
    } else {
      setOpenDropdown(index);
      setOpenDropdown2(null);
      setVisibleActivities(null); // Ensure saved activities don't appear when selecting category
      setEditingIndex(null);
    }
  };

  // Toggle activity input field and saved activities visibility
  const toggleDropdown2 = (index, category) => {
    if (openDropdown2 === index) {
      setOpenDropdown2(null);
      setVisibleActivities(null); // Hide saved activities when closing input dropdown
    } else {
      setOpenDropdown2(index);
      setVisibleActivities(category); // Show saved activities for selected category
    }
  };

  // Handle input submission
  const handleSubmit = (category) => {
    if (activityInput.trim() !== "") {
      setSavedActivities((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), activityInput], // Append new activity
      }));
      setActivityInput("");
      setOpenDropdown2(null);
      setVisibleActivities(category); // Show saved activities when adding a new one
    }
  };

  // Enable editing mode for a specific activity
  const handleEdit = (category, idx) => {
    setEditingIndex(idx);
    setEditingText(savedActivities[category][idx]);
  };

  // Save edited activity
  const handleSaveEdit = (category) => {
    if (editingText.trim() !== "") {
      setSavedActivities((prev) => ({
        ...prev,
        [category]: prev[category].map((activity, idx) =>
          idx === editingIndex ? editingText : activity
        ),
      }));
      setEditingIndex(null);
      setEditingText("");
    }
  };

  return (
    <View style={styles.container}>
      <TopNav navigation={navigation} title="Input Your Schedule" profilePic={profilePic} />
      <View style={styles.content}>
        {scheduleOptions.map((option, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderNonWhite}>{option}</Text>

            {/* Dropdown button for selecting activity */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={() => toggleDropdown(index)}>
                <Text style={styles.buttonText}>Select Activity</Text>
              </TouchableOpacity>
            </View>

            {/* First dropdown - Create or View Activities */}
            {openDropdown === index && (
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => toggleDropdown2(index, option)}>
                  <Text style={styles.dropdownItemText}>{txt}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Second dropdown - Input Field */}
            {openDropdown2 === index && (
              <View style={styles.dropdown}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your activity..."
                  value={activityInput}
                  onChangeText={setActivityInput}
                />
                <Button title="Submit" onPress={() => handleSubmit(option)} />
              </View>
            )}

            {/* Show saved activities only when clicking on "Select Activity" */}
            {visibleActivities === option && savedActivities[option] && savedActivities[option].length > 0 && (
              <View style={styles.savedActivityContainer}>
                <Text style={styles.savedActivityHeader}>Saved Activities:</Text>
                {savedActivities[option].map((activity, idx) => (
                  <View key={idx} style={styles.activityItem}>
                    {editingIndex === idx ? (
                      // Edit Mode
                      <>
                        <TextInput
                          style={styles.input}
                          value={editingText}
                          onChangeText={setEditingText}
                        />
                        <Button title="Save" onPress={() => handleSaveEdit(option)} />
                      </>
                    ) : (
                      // Display Mode
                      <TouchableOpacity onPress={() => handleEdit(option, idx)}>
                        <Text style={styles.savedActivity}>- {activity}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
