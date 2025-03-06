import React, { useEffect } from 'react';
import { SafeAreaView, View, FlatList, ActivityIndicator } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';

const extractUserIdFromToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const payload = JSON.parse(jsonPayload);
    const uid = payload.user_id || payload.sub;
    return uid;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

const FriendRequestsScreen = ({ navigation, route }) => {
  const profilePic = route.params?.profilePic || null;
  const userSlice = useStore((state) => state.userSlice);

  const {
    currentUser,
    friendRequests,
    status,
    error,
    fetchFriendRequests,
    acceptRequest,
    declineRequest,
    refreshUserProfile,
  } = userSlice;

  let userID = currentUser?.userID;
  const idToken = currentUser?.idToken;

  let firebaseUid = null;
  if (idToken) {
    firebaseUid = extractUserIdFromToken(idToken);
  }

  if (!userID && firebaseUid) {
    userID = firebaseUid;
  } else if (!userID && currentUser?._id) {
    userID = currentUser._id;
  }

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const effectiveUserID =
      currentUser.userID || firebaseUid || currentUser.verifiedAuthId;

    if (!effectiveUserID || !idToken) {
      return;
    }

    fetchFriendRequests({
      idToken,
      userID: effectiveUserID,
    });
  }, [currentUser, idToken]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (idToken && userID) {
        fetchFriendRequests({ idToken, userID });
      }
    });

    return unsubscribe;
  }, [navigation, idToken, userID]);

  if (!userSlice.isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Friend Requests"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            Please log in to view friend requests
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Login')}>
            Go to Login
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = async (senderID) => {
    const result = await acceptRequest({
      idToken,
      userID,
      senderID,
    });
  };

  const handleDecline = async (senderID) => {
    await declineRequest({ idToken, userID, senderID });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Friend Requests"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={styles.COLORS?.primary || '#096A2E'}
          />
          <Text style={{ marginTop: 20 }}>Loading friend requests...</Text>
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
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: 'red', marginBottom: 20 }}>Error: {error}</Text>
          <Button
            mode="contained"
            onPress={() => {
              if (idToken && userID) {
                fetchFriendRequests({ idToken, userID });
              }
            }}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderRequest = ({ item, index }) => {
    return (
      <Card style={styles.userCard}>
        <View style={styles.userCardInfo}>
          <Avatar.Text
            size={40}
            label={
              item.senderName ? item.senderName.charAt(0).toUpperCase() : '?'
            }
          />
          <View style={styles.userCardText}>
            <Text style={styles.userName}>
              {item.senderName || 'Unknown User'}
            </Text>
            <Text style={styles.userEmail}>
              {item.senderEmail || 'No email'}
            </Text>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Friend Requests"
        profilePic={profilePic}
      />
      <View style={styles.content}>
        {!friendRequests || friendRequests.length === 0 ? (
          <View
            style={[
              styles.content,
              { justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={{ fontSize: 16, marginBottom: 20 }}>
              No friend requests at the moment.
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                if (idToken && userID) {
                  fetchFriendRequests({ idToken, userID });
                }
              }}
            >
              Refresh
            </Button>
          </View>
        ) : (
          <FlatList
            data={friendRequests}
            keyExtractor={(item, index) => item.senderID || `request-${index}`}
            renderItem={renderRequest}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsContentContainer}
            refreshing={status === 'loading'}
            onRefresh={() => {
              if (idToken && userID) {
                fetchFriendRequests({ idToken, userID });
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default FriendRequestsScreen;
