import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import app from '../configs/firebase';

const auth = getAuth(app);

const newUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    return null;
  }
};

const signIn = async (username, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      `${username}@dummyemail.com`,
      password,
    );
    return userCredential.user;
  } catch (error) {
    return null;
  }
};

const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    return false;
  }
};

const subscribeToUser = (callback) => {
  return onAuthStateChanged(auth, callback);
};

const getUser = () => {
  const user = auth.currentUser;
  if (user) {
    return user;
  } else {
    return null;
  }
};

export default {
  newUser,
  signIn,
  signOut,
  subscribeToUser,
  getUser,
};
