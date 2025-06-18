const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  getUserByGoogleId,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  syncUser,
  adminModifyXenoCoins,
  getXenoCoinHistory,
  getUsersWithXenoCoinStats,
  testAwardXenoCoins,
  testOrderDelivery,
} = require("./user.controller");

const router = express.Router();

// Sync user from Firebase
router.post("/sync", syncUser);

// Get user statistics
router.get("/stats", getUserStats);

// Get all users
router.get("/", getAllUsers);

// Get user by Google ID
router.get("/google/:googleId", getUserByGoogleId);

// Get single user
router.get("/:id", getSingleUser);

// Create user
router.post("/", createUser);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

// XenoCoin routes
router.post("/xenocoin/admin-modify", adminModifyXenoCoins);
router.get("/xenocoin/history/:userId", getXenoCoinHistory);
router.get("/xenocoin/admin/users", getUsersWithXenoCoinStats);
router.post("/xenocoin/test-award", testAwardXenoCoins);
router.post("/xenocoin/test-delivery", testOrderDelivery);

module.exports = router;
