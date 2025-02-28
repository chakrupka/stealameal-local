import React, { useEffect } from 'react';
import { SafeAreaView, View, FlatList, ActivityIndicator } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';

// Function to extract Firebase UID from JWT token
const extractUserIdFromToken = (token) => {
  try {
    console.log('Attempting to extract UID from token');
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token format, not a JWT');
      return null;
    }

    // Decode the payload (middle part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const payload = JSON.parse(jsonPayload);
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // Return the user_id from the payload
    const uid = payload.user_id || payload.sub;
    console.log('Extracted UID from token:', uid);
    return uid;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

const FriendRequestsScreen = ({ navigation, route }) => {
  console.log('==========================================');
  console.log('FriendRequestsScreen RENDERING');
  console.log('==========================================');

  const profilePic = route.params?.profilePic || null;

  // Get the entire userSlice state
  const userSlice = useStore((state) => state.userSlice);

  console.log('Full userSlice state:', JSON.stringify(userSlice, null, 2));

  const {
    currentUser,
    friendRequests,
    status,
    error,
    fetchFriendRequests,
    acceptRequest,
    declineRequest,
  } = userSlice;

  // Log the whole currentUser object to see its structure
  console.log('Current user object:', JSON.stringify(currentUser, null, 2));

  // Try different possible ID field names
  let userID = currentUser?.userID;

  console.log('Initial userID from currentUser:', userID);

  const idToken = currentUser?.idToken;

  // Extract Firebase UID from token as a fallback
  let firebaseUid = null;
  if (idToken) {
    firebaseUid = extractUserIdFromToken(idToken);
    console.log('Firebase UID extracted from token:', firebaseUid);
  }

  // Choose the best userID
  if (!userID && firebaseUid) {
    userID = firebaseUid;
    console.log('Using Firebase UID from token as userID:', userID);
  } else if (!userID && currentUser?._id) {
    userID = currentUser._id;
    console.log('WARNING: Falling back to MongoDB _id as userID:', userID);
  }

  console.log('Authentication status:', {
    userExists: !!currentUser,
    isLoggedIn: userSlice.isLoggedIn,
    hasToken: !!idToken,
    hasUserID: !!userID,
    userIDType: typeof userID,
    userIDLength: userID ? userID.length : 0,
    status: status,
  });

  console.log('Friend requests:', friendRequests ? friendRequests.length : 0);
  if (friendRequests && friendRequests.length > 0) {
    console.log(
      'Friend request details:',
      JSON.stringify(friendRequests, null, 2),
    );
  }

  useEffect(() => {
    console.log('FriendRequestsScreen useEffect triggered');

    if (!currentUser) {
      console.log("No current user, can't fetch friend requests");
      return;
    }

    // Choose the best userID to use
    const effectiveUserID =
      currentUser.userID || firebaseUid || currentUser.verifiedAuthId;

    if (!effectiveUserID) {
      console.error('Cannot determine a valid userID for API call');
      if (idToken) {
        console.log('Attempting to extract userID from token payload...');
        const extractedId = extractUserIdFromToken(idToken);
        if (extractedId) {
          console.log('Successfully extracted userID from token:', extractedId);
          userID = extractedId;
        } else {
          console.error('Failed to extract userID from token');
        }
      }
      return;
    }

    if (!idToken) {
      console.error('Missing idToken in currentUser');
      return;
    }

    console.log(`Fetching friend requests with userID: ${effectiveUserID}`);
    fetchFriendRequests({
      idToken,
      userID: effectiveUserID,
    });

    // Return cleanup function
    return () => {
      console.log('FriendRequestsScreen useEffect cleanup');
    };
  }, [currentUser, idToken, firebaseUid, fetchFriendRequests]);

  // If not logged in, show login prompt
  if (!userSlice.isLoggedIn) {
    console.log('User not logged in, showing login prompt');
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

  const handleAccept = (senderID) => {
    console.log('Accepting request from:', senderID);
    console.log('Using userID for acceptance:', userID);
    acceptRequest({ idToken, userID, senderID });
  };

  const handleDecline = (senderID) => {
    console.log('Declining request from:', senderID);
    console.log('Using userID for decline:', userID);
    declineRequest({ idToken, userID, senderID });
  };

  if (status === 'loading') {
    console.log('Friend requests loading...');
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
    console.log('Friend requests failed to load. Error:', error);
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
                console.log('Retrying with userID:', userID);
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
    console.log(`Rendering request item ${index}:`, item);
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

  console.log(
    'Rendering main component with friend requests:',
    friendRequests ? friendRequests.length : 0,
  );

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
                  console.log('Refreshing with userID:', userID);
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
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default FriendRequestsScreen;
