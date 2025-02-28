// src/middleware/require-auth.js
import admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  try {
    // Check if we're using a JSON string from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Initializing Firebase Admin from environment variable');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Otherwise, try direct import (ensure you have a proper service account file)
    else {
      console.log('Initializing Firebase Admin from service account file');
      // If you're using a direct import, uncomment and adjust this:
      // import serviceAccount from '../config/firebase-service-account.json';
      // admin.initializeApp({
      //   credential: admin.credential.cert(serviceAccount),
      // });

      // Or if you're using a file path:
      const serviceAccountPath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        '../config/firebase-service-account.json';
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
    }
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

// Define the token verification function in the same file
async function verifyAuth(idToken) {
  try {
    // Decode token & return the UID
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}

// Middleware function
const requireAuth = async (req, res, next) => {
  console.log('Authentication middleware called');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Authorization header exists:', !!req.headers.authorization);

  // Allow creating users without a token => POST /auth is public
  if (req.path === '/auth' && req.method === 'POST') {
    console.log('Skipping auth for user creation');
    return next();
  }

  const authHeader = req.headers.authorization || null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header or invalid format');
    return res
      .status(401)
      .json({ error: 'Unauthorized - Missing or invalid token format' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    // Call the verifyAuth function we defined
    const verifiedAuthId = await verifyAuth(idToken);
    console.log('Verified Auth ID:', verifiedAuthId);

    if (!verifiedAuthId) {
      console.error('Failed to verify token');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Store the verified Firebase UID in the request
    req.verifiedAuthId = verifiedAuthId;
    return next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res
      .status(401)
      .json({ error: 'Unauthorized - Token verification failed' });
  }
};

// Export both the admin instance and the middleware
export { admin };
export default requireAuth;
