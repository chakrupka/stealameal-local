import * as Auth from '../services/firebase-auth';
import * as Api from '../services/user-api';

const createUserSlice = (set, get) => ({
  user: null,

  createUser: async (email, password, firstName, lastName) => {
    try {
      const idToken = await Auth.createUser(email, password);
      const databaseUser = await Api.createUser(idToken, {
        email,
        firstName,
        lastName,
      });
      set(
        (state) => {
          state.userSlice.user = databaseUser;
        },
        false,
        'user/createUser',
      );
      return databaseUser;
    } catch (err) {
      console.error('Error creating user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  signIn: async (email, password) => {
    try {
      const idToken = await Auth.signInUser(email, password);
      const databaseUser = await Api.fetchOwnUser(idToken);
      set(
        (state) => {
          state.userSlice.user = databaseUser;
        },
        false,
        'user/signInUser',
      );
      return databaseUser;
    } catch (err) {
      console.error('Error signing in user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  signOut: async () => {
    try {
      await Auth.signOutUser();
      set(
        (state) => {
          state.userSlice.user = null;
        },
        false,
        'user/signOutUser',
      );
      return true;
    } catch (err) {
      console.error('Error signing out user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  setAndFetchUser: async (user) => {
    try {
      if (user) {
        const idToken = await user.getIdToken();
        const databaseUser = await Api.fetchOwnUser(idToken);
        set(
          (state) => {
            state.userSlice.user = databaseUser;
          },
          false,
          'user/setAndFetchUser',
        );
      } else {
        set(
          (state) => {
            state.userSlice.user = null;
          },
          false,
          'user/setAndFetchUser',
        );
      }
    } catch (err) {
      console.error('Error setting and fetching user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  updateUser: async (userID, updatedUserData) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      const updatedUser = await Api.updateUser(
        idToken,
        userID,
        updatedUserData,
      );
      set(
        (state) => {
          state.userSlice.user = updatedUser;
        },
        false,
        'user/updateUser',
      );
      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },

  deleteUser: async (userID) => {
    try {
      const idToken = await Auth.getUser().getIdToken();
      await Api.deleteUser(idToken, userID);
      set(
        (state) => {
          state.userSlice.user = null;
        },
        false,
        'user/deleteUser',
      );
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      get().errorSlice.newError(err);
      throw err;
    }
  },
});

export default createUserSlice;
