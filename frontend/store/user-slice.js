import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  searchUsersByEmail,
  fetchOwnUser,
  updateUser,
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
