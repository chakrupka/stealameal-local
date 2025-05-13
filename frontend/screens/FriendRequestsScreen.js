import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import useStore from '../store';
import styles from '../styles';
import TopNav from '../components/TopNav';
import { MaterialIcons } from '@expo/vector-icons';

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
  const userSlice = useStore((state) => state.userSlice);

  const {
    currentUser,
    friendRequests,
    status,
    error,
    fetchFriendRequests,
    acceptRequest,
    declineRequest,
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

  const handleAccept = async (senderID) => {
    await acceptRequest({
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
      <SafeAreaView style={[styles.container, localStyles.fullWidth]}>
        <TopNav navigation={navigation} title="Friend Requests" />
        <View style={[styles.content, localStyles.centerContent]}>
          <ActivityIndicator
            size="large"
            color={styles.COLORS?.primary || '#096A2E'}
          />
          <Text style={localStyles.loadingText}>
            Loading friend requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'failed') {
    return (
      <SafeAreaView style={[styles.container, localStyles.fullWidth]}>
        <TopNav navigation={navigation} title="Friend Requests" />
        <View style={[styles.content, localStyles.centerContent]}>
          <Text style={localStyles.errorText}>Error: {error}</Text>
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

  const renderRequest = ({ item }) => {
    return (
      <Card style={[styles.userCard, { width: '100%' }]}>
        <View style={localStyles.headerRow}>
          <View style={[styles.userCardInfo, localStyles.cardInfoRow]}>
            {!item.senderProfilePic ? (
              <Avatar.Text
                size={40}
                label={
                  item.senderName
                    ? item.senderName.charAt(0).toUpperCase()
                    : '?'
                }
              />
            ) : (
              <Avatar.Image size={40} source={{ uri: item.senderProfilePic }} />
            )}
            <View style={[styles.userCardText, localStyles.cardTextFullWidth]}>
              <Text style={styles.userName}>
                {item.senderName || 'Unknown User'}
              </Text>
              <Text
                style={[styles.userEmail, localStyles.cardTextFullWidth]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.senderEmail || 'No email'}
              </Text>
            </View>
          </View>
          <View style={localStyles.actionButtonsRow}>
            <Button
              onPress={() => handleDecline(item.senderID)}
              style={localStyles.actionButton}
              compact
              labelStyle={localStyles.actionButtonLabel}
            >
              <MaterialIcons name="person-off" size={35} color={'gray'} />
            </Button>
            <Button
              onPress={() => handleAccept(item.senderID)}
              style={localStyles.actionButton}
              compact
              labelStyle={localStyles.actionButtonLabel}
            >
              <MaterialIcons name="person-add-alt-1" size={35} />
            </Button>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, localStyles.fullWidth]}>
      <TopNav navigation={navigation} title="Friend Requests" />
      <View
        style={[
          styles.content,
          localStyles.fullWidth,
          localStyles.noPaddingHorizontal,
        ]}
      >
        {!friendRequests || friendRequests.length === 0 ? (
          <View style={[styles.content, localStyles.centerContent]}>
            <Text style={localStyles.text16MarginBottom20}>
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
            contentContainerStyle={localStyles.flatlistContent}
            refreshing={status === 'loading'}
            style={localStyles.fullWidth}
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

const localStyles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
  },
  cardTextFullWidth: {
    width: '100%',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: -10,
  },
  actionButton: {
    width: 55,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonLabel: {
    lineHeight: 35,
  },
  fullWidth: {
    width: '100%',
  },
  noPaddingHorizontal: {
    paddingHorizontal: 0,
  },
  flatlistContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },
});

export default FriendRequestsScreen;
