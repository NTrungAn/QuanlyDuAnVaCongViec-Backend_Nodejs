const { verifyAccessToken } = require('../utils/jwt.util');
const User = require('../models/User.model');

const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  req.body = value;
  next();
};

const protect = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. Please provide Bearer token.' });
    }

    const token = bearer.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = currentUser;
    req.user.roles = currentUser.roles || [];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (roles.length && !roles.some((role) => req.user.roles.includes(role))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

module.exports = {
  validate,
  protect,
  authorize,
};