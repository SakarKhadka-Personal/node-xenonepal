const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} = require("./user.controller");

const router = express.Router();

// Get user statistics
router.get("/stats", getUserStats);

// Get all users
router.get("/", getAllUsers);

// Get single user
router.get("/:id", getSingleUser);

// Create user
router.post("/create", createUser);

// Update user
router.put("/edit/:id", updateUser);

// Delete user
router.delete("/delete/:id", deleteUser);

module.exports = router;
