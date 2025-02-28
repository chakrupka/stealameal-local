// src/services/auth.js

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Check if already initialized to avoid duplicate initialization
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = getAuth(admin.app());

const verifyAuth = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('decodedToken.uid:', decodedToken.uid);
    return decodedToken.uid;
  } catch (err) {
    return null;
  }
};

export { admin }; // Export the initialized admin instance
export default verifyAuth;
