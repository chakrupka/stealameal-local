import axios from 'axios';
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  searchUsersByEmail,
  fetchOwnUser,
  updateUser,
  updateUserLocation,
} from '../services/user-api';
import { signInUser, signOutUser } from '../services/firebase-auth';

const createUserSlice = (set, get) => ({
  currentUser: null,
  isLoggedIn: false,

  friendRequests: [],
  searchResults: [],
  status: 'idle',
  error: null,

  // Function to fix all timestamp issues in the database
  fixAllLocationTimestamps: async () => {
    const { currentUser } = get().userSlice;

    if (!currentUser || !currentUser.idToken) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const result = await fixLocationTimestamps(currentUser.idToken);
      console.log('TIMESTAMP DEBUG - Fix result:', result);

      return { success: true, result };
    } catch (error) {
      console.error('TIMESTAMP DEBUG - Fix error:', error);
      return { success: false, error: error.message };
    }
  },

  updateUserProfile: async (userData) => {
    const { currentUser } = get().userSlice;

    if (!currentUser || !currentUser._id || !currentUser.idToken) {
      return { success: false, error: 'Not logged in' };
    }

    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      let response;

      // If it's a location update, use the specialized endpoint
      if ('location' in userData && Object.keys(userData).length === 1) {
        console.log('TIMESTAMP DEBUG - Before updateUserLocation call');
        response = await updateUserLocation(
          currentUser.idToken,
          currentUser._id,
          userData.location,
        );
        console.log('TIMESTAMP DEBUG - After updateUserLocation call');
        console.log('TIMESTAMP DEBUG - Response from updateUserLocation:', {
          hasResponse: !!response,
          hasLocationUpdatedAt: response && !!response.locationUpdatedAt,
          locationUpdatedAtValue: response ? response.locationUpdatedAt : null,
        });
      } else {
        // Otherwise use the general update endpoint
        response = await axios.patch(
          `http://localhost:9090/api/users/${currentUser._id}`,
          userData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser.idToken}`,
            },
          },
        );
        response = response.data;
      }

      console.log('TIMESTAMP DEBUG - Before state update');
      console.log('TIMESTAMP DEBUG - Current state currentUser:', {
        hasCurrentUser: !!get().userSlice.currentUser,
        locationUpdatedAt: get().userSlice.currentUser
          ? get().userSlice.currentUser.locationUpdatedAt
          : null,
      });

      // Update local state with the response
      set((state) => {
        console.log('TIMESTAMP DEBUG - Inside state update');
        console.log('TIMESTAMP DEBUG - Response object:', response);

        state.userSlice.status = 'succeeded';
        // Carefully merge the response, ensuring locationUpdatedAt is properly handled
        const updatedUser = {
          ...state.userSlice.currentUser,
          ...response,
        };

        // Extra check for locationUpdatedAt
        if (response.locationUpdatedAt) {
          console.log(
            'TIMESTAMP DEBUG - Store - response contains locationUpdatedAt:',
            response.locationUpdatedAt,
          );

          try {
            // Try parsing it into a valid Date and back to ISO string
            const date = new Date(response.locationUpdatedAt);
            if (!isNaN(date.getTime())) {
              // It's a valid date, store it as ISO string
              updatedUser.locationUpdatedAt = date.toISOString();
              console.log(
                'TIMESTAMP DEBUG - Store - Using formatted locationUpdatedAt:',
                updatedUser.locationUpdatedAt,
              );
            } else {
              console.error(
                'TIMESTAMP DEBUG - Store - Invalid date in response',
              );
            }
          } catch (err) {
            console.error('TIMESTAMP DEBUG - Store - Error parsing date:', err);
          }
        } else if (response.location) {
          console.log(
            'TIMESTAMP DEBUG - Store - Location updated but no timestamp provided',
          );
        }

        state.userSlice.currentUser = updatedUser;

        console.log('TIMESTAMP DEBUG - After merge:', {
          locationUpdatedAt: state.userSlice.currentUser.locationUpdatedAt,
          location: state.userSlice.currentUser.location,
        });
      });

      console.log('TIMESTAMP DEBUG - After state update');
      console.log('TIMESTAMP DEBUG - Updated state currentUser:', {
        hasCurrentUser: !!get().userSlice.currentUser,
        locationUpdatedAt: get().userSlice.currentUser
          ? get().userSlice.currentUser.locationUpdatedAt
          : null,
      });

      return { success: true, data: response };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = error.message || 'Failed to update profile';
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Update failed',
      };
    }
  },

  login: async ({ email, password }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const idToken = await signInUser(email, password);

      const userData = await fetchOwnUser(idToken);
      if (!userData.profilePic) {
        userData.profilePic =
          'https://tripcoordinator.s3.amazonaws.com/7AF4A5DC-22C0-4D3F-8357-2DCC6DE85437.jpeg';
      }

      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.currentUser = {
          ...userData,
          idToken,
        };
        state.userSlice.isLoggedIn = true;
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = error.message || 'Login failed';
        state.userSlice.isLoggedIn = false;
        state.userSlice.currentUser = null;
      });

      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  },

  logout: async () => {
    set((state) => {
      state.userSlice.status = 'loading';
    });

    try {
      await signOutUser();

      set((state) => {
        state.userSlice.status = 'idle';
        state.userSlice.currentUser = null;
        state.userSlice.isLoggedIn = false;
        state.userSlice.friendRequests = [];
      });

      return { success: true };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = error.message || 'Logout failed';
      });
      return { success: false, error: error.message || 'Logout failed' };
    }
  },

  refreshUserProfile: async () => {
    const { currentUser } = get().userSlice;

    if (!currentUser || !currentUser.idToken) {
      return { success: false, error: 'Not logged in' };
    }

    set((state) => {
      state.userSlice.status = 'loading';
    });

    try {
      const userData = await fetchOwnUser(currentUser.idToken);

      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.currentUser = {
          ...userData,
          idToken: currentUser.idToken,
        };
      });

      return { success: true };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = error.message || 'Failed to refresh profile';
      });
      return { success: false, error: error.message };
    }
  },

  sendRequest: async ({
    idToken,
    senderID,
    senderName,
    senderEmail,
    receiverID,
  }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const response = await sendFriendRequest(
        idToken,
        senderID,
        senderName,
        senderEmail,
        receiverID,
      );

      set((state) => {
        state.userSlice.status = 'succeeded';
      });

      return {
        success: true,
        message:
          response.userFriendlyMessage ||
          response.message ||
          'Friend request sent!',
      };
    } catch (error) {
      console.error('Failed to send friend request:', error);

      const userFriendlyMessage =
        error.response?.data?.userFriendlyMessage ||
        error.response?.data?.message ||
        error.userFriendlyMessage ||
        'Failed to send friend request';

      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = userFriendlyMessage;
      });

      return {
        success: false,
        error: userFriendlyMessage,
        errorDetails: error.response?.data || error.message,
      };
    }
  },

  fetchFriendRequests: async ({ idToken, userID }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const requests = await getFriendRequests(idToken, userID);

      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.friendRequests = requests || [];
      });

      return { success: true, requests };
    } catch (error) {
      console.error('Error fetching friend requests:', error);

      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data?.error || 'Failed to fetch friend requests';
      });

      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch friend requests',
      };
    }
  },

  acceptRequest: async ({ idToken, userID, senderID }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      await acceptFriendRequest(idToken, userID, senderID);

      // Get the updated user profile from the server
      const userData = await fetchOwnUser(idToken);

      set((state) => {
        state.userSlice.status = 'succeeded';
        // Remove the request from friendRequests
        state.userSlice.friendRequests = state.userSlice.friendRequests.filter(
          (request) => request.senderID !== senderID,
        );

        // Update the entire user object with the fresh data
        state.userSlice.currentUser = {
          ...userData,
          idToken: idToken,
        };
      });

      return { success: true };
    } catch (error) {
      console.error('Error accepting friend request:', error);

      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data?.error || 'Failed to accept friend request';
      });
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to accept friend request',
      };
    }
  },

  declineRequest: async ({ idToken, userID, senderID }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      await declineFriendRequest(idToken, userID, senderID);
      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.friendRequests = state.userSlice.friendRequests.filter(
          (request) => request.senderID !== senderID,
        );
      });
      return { success: true };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data || 'Failed to decline friend request';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to decline friend request',
      };
    }
  },

  searchUsers: async ({ idToken, email }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const results = await searchUsersByEmail(idToken, email);
      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.searchResults = results;
      });
      return { success: true, results };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data || 'Failed to search users';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to search users',
      };
    }
  },

  updateUserInfo: async (updatedInfo) => {
    const { currentUser } = get().userSlice;

    if (!currentUser || !currentUser.idToken) {
      return { success: false, error: 'Not logged in' };
    }

    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const { idToken, _id } = currentUser;
      const userData = await updateUser(idToken, _id, updatedInfo);

      set((state) => {
        state.userSlice.status = 'succeeded';
        state.userSlice.currentUser = {
          ...userData,
          idToken: idToken,
        };
      });
      return { success: true, userData };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error = error.response?.data || 'Failed to update user';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to update user',
      };
    }
  },
});

export default createUserSlice;
