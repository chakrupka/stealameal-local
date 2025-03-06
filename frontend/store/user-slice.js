import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  searchUsersByEmail,
  fetchOwnUser,
} from '../services/user-api';
import { signInUser, signOutUser } from '../services/firebase-auth';

const createUserSlice = (set, get) => ({
  currentUser: null,
  isLoggedIn: false,

  friendRequests: [],
  searchResults: [],
  status: 'idle',
  error: null,

  login: async ({ email, password }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      const idToken = await signInUser(email, password);
      console.log('Login - Got idToken from Firebase');

      const userData = await fetchOwnUser(idToken);
      console.log(
        'Login - Got user data from backend:',
        JSON.stringify(userData, null, 2),
      );

      console.log(
        'Login - User ID is:',
        userData.userID || userData._id || userData.id,
      );

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
      console.log('Fetching friend requests for userID:', userID);
      console.log('Using idToken:', idToken ? 'Valid token' : 'Invalid token');

      // Call the API to get friend requests
      const requests = await getFriendRequests(idToken, userID);
      console.log('Friend requests response:', JSON.stringify(requests));

      set((state) => {
        state.userSlice.status = 'succeeded';
        // Store the requests as returned by the API
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
      // Pass parameters in correct order: token, receiverID (current user), senderID
      await acceptFriendRequest(idToken, userID, senderID);

      set((state) => {
        state.userSlice.status = 'succeeded';
        // Remove the request from friendRequests
        state.userSlice.friendRequests = state.userSlice.friendRequests.filter(
          (request) => request.senderID !== senderID,
        );

        // Add the new friend to the friendsList
        if (!state.userSlice.currentUser.friendsList) {
          state.userSlice.currentUser.friendsList = [];
        }

        // Add new friend to the friendsList
        state.userSlice.currentUser.friendsList.push({
          friendID: senderID,
          locationAvailable: false,
        });
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
});

export default createUserSlice;
