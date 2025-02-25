import verifyAuth from '../services/auth';

const requireAuth = async (req, res, next) => {
  console.log({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });
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
    req.verifiedAuthId = verifiedAuthId;
    return next();
  } catch (err) {
    return res.status(500).json({ err });
  }
};

export default requireAuth;
