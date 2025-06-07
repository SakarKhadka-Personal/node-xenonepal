const User = require("./user.model");
const bcrypt = require("bcryptjs");

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
    } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select("-password") // Exclude password from response
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).send({
      message: "Users fetched successfully",
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).send({ message: "Failed to fetch users from db" });
  }
};

// Get Single User
const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).send({ message: "User Not Found" });
    }
    res.status(200).send({ message: "User fetched successfully" });
  } catch (error) {
    console.error("Error fetching user", error);
    res.status(500).send({ message: "Failed to fetch user" });
  }
};

// Create User
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      status = "active",
      phone,
      address,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ message: "User with this email already exists" });
    }

    // Hash password if provided
    let hashedPassword = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      status,
      phone,
      address,
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).send({
      message: "User Created Successfully",
      user: userResponse,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send({
        message: "Validation Error",
        errors: error.errors,
      });
    }
    console.error("Error creating user", error);
    res.status(500).send({ message: "Failed to create user" });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).send({ message: "User Not Found" });
    }

    res.status(200).send({
      message: "User Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send({
        message: "Validation Error",
        errors: error.errors,
      });
    }
    console.error("Error updating user", error);
    res.status(500).send({ message: "Failed to update user" });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send({ message: "User Not Found" });
    }

    res.status(200).send({
      message: "User Deleted Successfully",
      user: { id: deletedUser._id, name: deletedUser.name },
    });
  } catch (error) {
    console.error("Error deleting user", error);
    res.status(500).send({ message: "Failed to delete user" });
  }
};

// Get User Statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    res.status(200).send({
      message: "User statistics fetched successfully",
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats", error);
    res.status(500).send({ message: "Failed to fetch user statistics" });
  }
};

// Sync user data from Firebase
const syncUser = async (req, res) => {
  try {
    const { name, email, googleId, photoURL } = req.body;

    // Try to find existing user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Update existing user
      user.lastLogin = new Date();
      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      if (name) user.name = name;
      if (photoURL) user.photoURL = photoURL;

      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        photoURL,
        role: "user",
        status: "active",
        lastLogin: new Date(),
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in syncUser:", error);
    res.status(500).json({
      message: "Error synchronizing user",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  syncUser,
};
