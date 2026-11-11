import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'idea2impact-jwt-secret-fallback-key-2026';

export function requireAuth(req, res, next) {
  const token = req.cookies?.session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Ignore invalid token in optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user?.roles?.some(r => roles.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions for this action.' });
  }
  next();
};
