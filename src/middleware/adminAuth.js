const User = require("../user/user.model");

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
  try {
    // For now, we'll use a simple admin check
    // In a production environment, you'd want to implement proper JWT validation
    const { adminkey } = req.headers;

    // Simple admin key validation (replace with proper auth)
    // For development, allow a default key if env var is not set
    const expectedKey = process.env.ADMIN_SECRET_KEY || "admin-secret-key";

    if (adminkey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    // Add admin user info to request for tracking
    req.user = {
      uid: "admin", // This should be replaced with actual Firebase UID in production
      role: "admin",
    };

    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during admin verification",
    });
  }
};

// Alternative middleware for Firebase-based admin verification
const verifyAdminWithFirebase = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No valid token provided",
      });
    }

    // Extract Firebase UID from token (you'd need to implement Firebase Admin SDK verification)
    const firebaseUID = req.headers["x-user-id"]; // This should come from Firebase token verification

    if (!firebaseUID) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });
    }

    // Check if user is admin in database
    const user = await User.findOne({ googleId: firebaseUID });
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Admin access required",
      });
    }

    req.user = {
      uid: firebaseUID,
      role: user.role,
      user: user,
    };

    next();
  } catch (error) {
    console.error("Firebase admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during admin verification",
    });
  }
};

module.exports = {
  verifyAdmin,
  verifyAdminWithFirebase,
};
