const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token found, return error
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in. Please log in to get access.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({
          status: "error",
          message: "Your token has expired. Please log in again.",
        });
      }

      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "The user belonging to this token no longer exists.",
        });
      }

      // Grant access to protected route
      req.user = {
        userId: user._id,
        email: user.email,
      };
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          status: "error",
          message: "Invalid token. Please log in again.",
        });
      } else if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "error",
          message: "Your token has expired. Please log in again.",
        });
      } else {
        throw jwtError; // Re-throw unexpected errors
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Authentication failed due to server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Optional middleware for routes that can work with or without authentication
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // No token, but that's okay - continue without authentication
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (user) {
        // User exists, set req.user
        req.user = {
          userId: user._id,
          email: user.email,
        };
      } else {
        // User doesn't exist, but that's okay for optional auth
        req.user = null;
      }
      next();
    } catch (jwtError) {
      // Invalid token, but that's okay for optional auth
      req.user = null;
      next();
    }
  } catch (error) {
    // For server errors, we still want to fail
    console.error("Optional auth middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error during authentication",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { protect, optionalAuth };
