const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';

/**
 * Validates Authorization: Bearer <token> header.
 * On success, sets req.user = { id, role, permissions }
 * and populates backward-compatible x-user-id / x-user-role headers
 * so existing controllers (tripController, etc.) need no changes.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    // Backward-compatible headers so existing controllers keep working unchanged
    req.headers['x-user-id'] = String(decoded.id);
    req.headers['x-user-role'] = decoded.role;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
};

/**
 * Middleware factory: requires the authenticated user to have a specific role.
 * Must be placed AFTER authenticate.
 */
const requireRole = (roleName) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== roleName) {
    return res.status(403).json({ error: `Access denied. Role '${roleName}' required.` });
  }

  next();
};

/**
 * Middleware factory: requires the authenticated user to have a specific permission.
 * Must be placed AFTER authenticate.
 */
const requirePermission = (permissionName) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!req.user.permissions.includes(permissionName)) {
    return res.status(403).json({ error: `Access denied. Permission '${permissionName}' required.` });
  }

  next();
};

module.exports = { authenticate, requireRole, requirePermission };
