// src/middleware/require-auth.js
import admin from 'firebase-admin';

// Initialize admin if not already
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Define the token verification function in the same file
async function verifyAuth(idToken) {
  // decode token & return the UID (or entire decoded token)
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}

// Now define your middleware
const requireAuth = async (req, res, next) => {
  console.log('Authentication middleware called');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Authorization header:', req.headers.authorization);

  // Allow creating users without a token => POST /api/auth is public
  if (req.path === '/api/auth' && req.method === 'POST') {
    return next();
  }

  const authHeader = req.headers.authorization || null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header or invalid format');
    return res.status(401).json({ error: 'unauthorized' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    // Call the verifyAuth function we just defined
    const verifiedAuthId = await verifyAuth(idToken);
    console.log('Verified Auth ID:', verifiedAuthId);

    if (!verifiedAuthId) {
      console.error('Failed to verify token');
      return res.status(401).json({ error: 'unauthorized' });
    }
    req.verifiedAuthId = verifiedAuthId; // The Firebase UID
    return next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

export default requireAuth;
