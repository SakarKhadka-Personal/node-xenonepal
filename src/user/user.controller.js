const User = require("./user.model");

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
    const user = await User.findById(id);

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
      googleId,
      role = "user",
      status = "active",
      phone,
      photoURL,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      googleId,
      photoURL,
      role,
      status,
      phone,
    });

    await newUser.save();
    res.status(201).send({
      message: "User Created Successfully",
      user: newUser,
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
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

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
    console.log("Sync user request body:", req.body);
    const { name, email, googleId, photoURL } = req.body;

    if (!email || !googleId) {
      console.log("Missing required fields:", { email, googleId });
      return res.status(400).json({
        message: "Email and googleId are required",
      });
    }

    console.log("Looking for existing user with email or googleId:", {
      email,
      googleId,
    });

    // Try to find existing user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    console.log("Found existing user:", user ? "Yes" : "No");

    if (user) {
      try {
        console.log("Updating existing user:", user._id);
        // Update existing user
        user.lastLogin = new Date();
        if (googleId && !user.googleId) {
          user.googleId = googleId;
        }
        if (name) user.name = name;
        if (photoURL) user.photoURL = photoURL;

        user = await user.save();
        console.log("User updated successfully");
      } catch (saveErr) {
        console.error("Error saving existing user:", saveErr);
        return res.status(500).json({
          message: "Error updating existing user",
          error: saveErr.message,
        });
      }
    } else {
      try {
        console.log("Creating new user");
        // Create new user
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          googleId,
          photoURL: photoURL || "",
          role: "user",
          status: "active",
          lastLogin: new Date(),
        });
        console.log("User created successfully:", user._id);
      } catch (createErr) {
        console.error("Error creating new user:", createErr);
        return res.status(500).json({
          message: "Error creating new user",
          error: createErr.message,
        });
      }
    }

    console.log("Sending success response");
    res.status(200).json({
      message: "User synchronized successfully",
      ...user.toObject(),
    });
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
