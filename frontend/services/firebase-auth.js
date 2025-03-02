import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import app from '../configs/firebase-config';

const auth = getAuth(app);

export const createUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

export const signInUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

export const signOutUser = () => {
  return firebaseSignOut(auth); // Use firebaseSignOut instead of signOut
};

export const subscribeToUser = (callback) => onAuthStateChanged(auth, callback);

export const getUser = () => {
  return auth.currentUser;
};
