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
  // Authentication State
  currentUser: null,
  isLoggedIn: false,

  // Friend Functionality State
  friendRequests: [],
  searchResults: [],
  status: 'idle',
  error: null,

  // Login Functionality
  login: async ({ email, password }) => {
    // Reset status and error
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      // 1. Authenticate with Firebase
      const idToken = await signInUser(email, password);

      // 2. Fetch the user's data from our backend
      const userData = await fetchOwnUser(idToken);

      // 3. Update the store with user data
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
  // ==============================
  // Logout Functionality
  // ==============================
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

  // ==============================
  // Refresh User Profile
  // ==============================
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

  // ==============================
  // Send Friend Request
  // ==============================
  sendRequest: async ({
    idToken,
    senderID,
    senderName,
    senderEmail,
    receiverEmail,
  }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      await sendFriendRequest(
        currentUser.idToken,
        currentUser.userID, // senderID
        currentUser.firstName + ' ' + currentUser.lastName, // senderName
        currentUser.email, // senderEmail
        selectedUserID, // receiverID
      );
      set((state) => {
        state.userSlice.status = 'succeeded';
      });
      return { success: true };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data || 'Failed to send friend request';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to send friend request',
      };
    }
  },

  // ==============================
  // Fetch Friend Requests
  // ==============================
  // user-slice.js
  fetchFriendRequests: async ({ idToken, userID }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      // returns an array of docs
      const requests = await getFriendRequests(idToken, userID);

      // REMOVE this transform code
      // const transformed = requests.map((u) => ({
      //   senderID: u._id,
      //   senderName: `${u.firstName} ${u.lastName}`,
      //   senderEmail: u.email,
      // }));

      set((state) => {
        state.userSlice.status = 'succeeded';
        // Store the subdocuments exactly as returned
        state.userSlice.friendRequests = requests;
      });

      return { success: true, requests };
    } catch (error) {
      set((state) => {
        state.userSlice.status = 'failed';
        state.userSlice.error =
          error.response?.data || 'Failed to fetch friend requests';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch friend requests',
      };
    }
  },

  // ==============================
  // Accept Friend Request
  // ==============================
  acceptRequest: async ({ idToken, userID, senderID }) => {
    set((state) => {
      state.userSlice.status = 'loading';
      state.userSlice.error = null;
    });

    try {
      await acceptFriendRequest(idToken, userID, senderID);
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
          error.response?.data || 'Failed to accept friend request';
      });
      return {
        success: false,
        error: error.response?.data || 'Failed to accept friend request',
      };
    }
  },

  // ==============================
  // Decline Friend Request
  // ==============================
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

  // ==============================
  // Search Users by Email
  // ==============================
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
