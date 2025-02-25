import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = getAuth(app);

const verifyAuth = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('decodedToken.uid:', decodedToken.uid);
    return decodedToken.uid;
  } catch (err) {
    return null;
  }
};

export default verifyAuth;
