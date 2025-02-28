import React, { useEffect } from 'react';
import { SafeAreaView, View, FlatList, ActivityIndicator } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';

const FriendRequestsScreen = ({ navigation, route }) => {
  const profilePic = route.params?.profilePic || null;

  const {
    friendRequests,
    status,
    error,
    fetchFriendRequests,
    acceptRequest,
    declineRequest,
    idToken,
    userID,
  } = useStore((state) => state.userSlice);

  useEffect(() => {
    if (idToken && userID) {
      fetchFriendRequests({ idToken, userID });
    }
  }, [idToken, userID, fetchFriendRequests]);

  const handleAccept = (senderID) => {
    acceptRequest({ idToken, userID, senderID });
  };

  const handleDecline = (senderID) => {
    declineRequest({ idToken, userID, senderID });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Friend Requests"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={styles.COLORS?.primary || '#096A2E'}
          />
          <Text style={styles.loadingText}>Loading friend requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Friend Requests"
          profilePic={profilePic}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderRequest = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userCardInfo}>
        <Avatar.Text
          size={40}
          label={item.senderName ? item.senderName.charAt(0).toUpperCase() : ''}
        />
        <View style={styles.userCardText}>
          <Text style={styles.userName}>{item.senderName}</Text>
          <Text style={styles.userEmail}>{item.senderEmail}</Text>
        </View>
      </View>
      <View style={styles.buttonGroup}>
        <Button
          mode="contained"
          onPress={() => handleAccept(item.senderID)}
          color="#096A2E"
          style={styles.acceptButton}
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDecline(item.senderID)}
          color="#FF3B30"
          style={styles.declineButton}
        >
          Decline
        </Button>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Friend Requests"
        profilePic={profilePic}
      />
      <View style={styles.content}>
        {friendRequests.length === 0 ? (
          <Text style={styles.noRequestsText}>
            No friend requests at the moment.
          </Text>
        ) : (
          <FlatList
            data={friendRequests}
            keyExtractor={(item) => item.senderID}
            renderItem={renderRequest}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsContentContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default FriendRequestsScreen;
