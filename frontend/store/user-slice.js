import * as Auth from '../services/auth';
import * as Api from '../services/backend-api';

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
        ({ userSlice }) => {
          userSlice.user = databaseUser;
        },
        false,
        'user/createUser',
      );
      return databaseUser;
    } catch (err) {
      get().errorSlice.newError(err);
      throw err;
    }
  },
  signIn: async (email, password) => {
    try {
      const idToken = await Auth.signInUser(email, password);
      const databaseUser = await Api.fetchOwnUser(idToken);
      set(
        ({ userSlice }) => {
          userSlice.user = databaseUser;
        },
        false,
        'user/signInUser',
      );
      return databaseUser;
    } catch (err) {
      get().errorSlice.newError(err);
      throw err;
    }
  },
  signOut: async () => {
    try {
      await Auth.signOutUser();
      set(
        ({ userSlice }) => {
          userSlice.user = null;
        },
        false,
        'user/signOutUser',
      );
      return true;
    } catch (err) {
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
          ({ userSlice }) => {
            userSlice.user = databaseUser;
          },
          false,
          'user/setAndFetchUser',
        );
      } else {
        set(
          ({ userSlice }) => {
            userSlice.user = null;
          },
          false,
          'user/setAndFetchUser',
        );
      }
    } catch (err) {
      get().errorSlice.newError(err);
      throw err;
    }
  },
});

export default createUserSlice;
