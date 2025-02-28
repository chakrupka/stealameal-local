// src/middleware/require-auth.js
import verifyAuth from '../services/auth';

const requireAuth = async (req, res, next) => {
  // Allow creating users without a token
  // => POST /api/auth is public
  if (req.path === '/api/auth' && req.method === 'POST') {
    return next();
  }

  const authHeader = req.headers.authorization || null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    const verifiedAuthId = await verifyAuth(idToken);
    if (!verifiedAuthId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    req.verifiedAuthId = verifiedAuthId; // The Firebase UID
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

export default requireAuth;
