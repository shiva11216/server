import { ApiError } from '../utils/ApiError.js';

// Middleware to check if user has required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};
