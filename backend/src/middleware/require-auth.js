// src/middleware/require-auth.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin using service account from environment variable
if (!admin.apps.length) {
  try {
    // Parse the Firebase service account JSON from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        'Firebase Admin initialized successfully with service account from environment',
      );
    } else {
      console.warn(
        '⚠️ Firebase service account not found in environment variables. Using limited initialization.',
      );
      // Initialize without credentials for limited functionality
      admin.initializeApp({
        projectId: 'mock-project-id',
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Initialize without credentials if there's an error
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'mock-project-id',
      });
    }
  }
}

// Export the admin instance to be used elsewhere
export { admin };

// Middleware to verify Firebase Auth token
const requireAuth = async (req, res, next) => {
  // Get the auth token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No valid authentication token provided.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Add the verified user ID to the request object
    req.verifiedAuthId = decodedToken.uid;

    // Log successful authentication
    console.log(`User ${decodedToken.uid} authenticated successfully`);

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // Special handling for development/testing
    if (process.env.NODE_ENV === 'development' && idToken === 'test-token') {
      console.warn('⚠️ Using test token authentication for development');
      req.verifiedAuthId = 'test-user-id';
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid authentication token.',
      details: error.message,
    });
  }
};

export default requireAuth;
