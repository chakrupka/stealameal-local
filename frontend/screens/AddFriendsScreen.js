import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Text, Avatar, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';

const AddFriendsScreen = ({ navigation, route }) => {
  const profilePic = route.params?.profilePic || null;
  const {
    searchResults,
    status,
    error,
    searchUsers,
    sendRequest,
    idToken,
    userID,
  } = useStore((state) => state.userSlice);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (idToken && email) {
      setSearching(true);
      const delayDebounceFn = setTimeout(() => {
        searchUsers({ idToken, email });
        setSearching(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [idToken, email, searchUsers]);

  const handleSendRequest = async (receiverEmail) => {
    await sendRequest({
      idToken,
      senderID: userID,
      senderName: 'Sender Name', // Replace with actual sender name
      senderEmail: 'Sender Email', // Replace with actual sender email
      receiverEmail,
    });
  };

  // Display loading spinner
  if (status === 'loading' || searching) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Add Friends"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={styles.COLORS?.primary || '#096A2E'}
          />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Display error message
  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Add Friends"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render individual search result item
  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userCardInfo}>
        <Avatar.Text
          size={40}
          label={item.name ? item.name.charAt(0).toUpperCase() : ''}
        />
        <View style={styles.userCardText}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={() => handleSendRequest(item.email)}
        color="#096A2E"
        style={styles.addButton}
      >
        Add Friend
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Add Friends"
        profilePic={profilePic}
      />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Search by email"
            placeholderTextColor="#888"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => Keyboard.dismiss()}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.userID}
          renderItem={renderUser}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.resultsContentContainer}
        />
      </View>
    </SafeAreaView>
  );
};

export default AddFriendsScreen;
