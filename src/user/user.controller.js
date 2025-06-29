const User = require("./user.model");
const Order = require("../order/order.model");
const emailService = require("../email/emailService");

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

    // TResting push

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

    // Get order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userOrders = await Order.find({ userId: user.googleId });
        const orderCount = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => {
          return sum + (order.order?.price || 0);
        }, 0);

        return {
          ...user.toObject(),
          orderCount,
          totalSpent,
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.status(200).send({
      message: "Users fetched successfully",
      users: usersWithStats,
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
    const { name, email, googleId, photoURL, phone } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        message: "Email and googleId are required",
      });
    }

    // Try to find existing user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });
    if (user) {
      try {
        // Check if this is a login after more than 24 hours
        const isReturningAfterLongTime = user.lastLogin
          ? new Date() - new Date(user.lastLogin) > 24 * 60 * 60 * 1000
          : true;

        // Update existing user
        user.lastLogin = new Date();
        if (googleId && !user.googleId) {
          user.googleId = googleId;
        }
        if (name) user.name = name;
        if (photoURL) user.photoURL = photoURL;
        if (phone && !user.phone) user.phone = phone; // Only set if user doesn't have phone

        user = await user.save();

        // Send welcome email for returning users (if they haven't logged in for over 24 hours)
        if (isReturningAfterLongTime) {
          try {
            await emailService.sendWelcomeEmail(user.email, {
              name: user.name,
              email: user.email,
            });
          } catch (emailError) {
            console.error(
              "Failed to send welcome email to returning user:",
              emailError
            );
            // Don't fail user sync if email fails
          }
        }
      } catch (saveErr) {
        console.error("Error saving existing user:", saveErr);
        return res.status(500).json({
          message: "Error updating existing user",
          error: saveErr.message,
        });
      }
    } else {
      try {
        // Create new user
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          googleId,
          photoURL: photoURL || "",
          phone: phone || "",
          role: "user",
          status: "active",
          lastLogin: new Date(),
        });
      } catch (createErr) {
        console.error("Error creating new user:", createErr);
        return res.status(500).json({
          message: "Error creating new user",
          error: createErr.message,
        });
      } // Send welcome and registration emails for new users
      try {
        // Send registration confirmation email
        await emailService.sendRegistrationEmail(user.email, {
          name: user.name,
          email: user.email,
        });

        // Also send welcome email
        await emailService.sendWelcomeEmail(user.email, {
          name: user.name,
          email: user.email,
        });
      } catch (emailError) {
        console.error(
          "Failed to send welcome/registration emails:",
          emailError
        );
        // Don't fail user creation if email fails
      }
    }

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

// Get User by Google ID (for order lookups)
const getUserByGoogleId = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await User.findOne({ googleId });

    if (!user) {
      return res.status(404).send({ message: "User Not Found" });
    }

    // Get order statistics for this user
    const userOrders = await Order.find({ userId: googleId });
    const orderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => {
      return sum + (order.order?.price || 0);
    }, 0);

    const userWithStats = {
      ...user.toObject(),
      orderCount,
      totalSpent,
    };

    res.status(200).send({
      message: "User fetched successfully",
      user: userWithStats,
    });
  } catch (error) {
    console.error("Error fetching user by googleId", error);
    res.status(500).send({ message: "Failed to fetch user" });
  }
};

// XenoCoin utility function to calculate earned coins
const calculateXenoCoins = (amountSpent) => {
  // Dynamic calculation: 1000 rupees = 1 XenoCoin
  // This means 100 rupees = 0.1 XenoCoin, 500 rupees = 0.5 XenoCoin, etc.
  const coinRate = 1000; // 1 XenoCoin per 1000 rupees
  const coinsEarned = amountSpent / coinRate;

  // Round to 1 decimal place for better precision
  // Examples:
  // 100 NPR = 0.1 XC, 500 NPR = 0.5 XC, 1500 NPR = 1.5 XC
  return Math.round(coinsEarned * 10) / 10;
};

// Award XenoCoins to user for order
const awardXenoCoins = async (userId, orderId, amountSpent) => {
  try {
    const coinsEarned = calculateXenoCoins(amountSpent);

    if (coinsEarned > 0) {
      const updateResult = await User.findOneAndUpdate(
        { googleId: userId },
        {
          $inc: { xenoCoins: coinsEarned },
          $push: {
            xenoCoinHistory: {
              type: "earn",
              amount: coinsEarned,
              source: "order_purchase",
              description: `Earned ${coinsEarned} XenoCoins for order worth NPR ${amountSpent}`,
              orderId: orderId,
              date: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!updateResult) {
        throw new Error(`User not found with googleId: ${userId}`);
      }
    }

    return coinsEarned;
  } catch (error) {
    return 0;
  }
};

// Admin function to credit/debit XenoCoins
const adminModifyXenoCoins = async (req, res) => {
  try {
    const { targetUserId, amount, type, description, adminId } = req.body;

    if (!targetUserId || !amount || !type || !adminId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (type !== "admin_credit" && type !== "admin_debit") {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    // Parse and validate amount (allow decimals)
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Round to 1 decimal place for consistency
    const roundedAmount = Math.round(parsedAmount * 10) / 10;

    const user = await User.findOne({ googleId: targetUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough coins for debit
    if (type === "admin_debit" && user.xenoCoins < roundedAmount) {
      return res.status(400).json({ message: "Insufficient XenoCoins" });
    }

    const updateAmount =
      type === "admin_credit" ? roundedAmount : -roundedAmount;

    const updateResult = await User.findOneAndUpdate(
      { googleId: targetUserId },
      {
        $inc: { xenoCoins: updateAmount },
        $push: {
          xenoCoinHistory: {
            type: type,
            amount: roundedAmount,
            source: "admin_action",
            description:
              description ||
              `Admin ${type.replace(
                "admin_",
                ""
              )} of ${roundedAmount} XenoCoins`,
            adminId: adminId,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updateResult) {
      return res.status(500).json({ message: "Failed to update user" });
    }

    res.status(200).json({
      message: `Successfully ${type.replace(
        "admin_",
        ""
      )}ed ${roundedAmount} XenoCoins`,
      newBalance: updateResult.xenoCoins,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to modify XenoCoins", error: error.message });
  }
};

// Get XenoCoin history for a user
const getXenoCoinHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const user = await User.findOne({ googleId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let history = user.xenoCoinHistory || [];

    // Filter by type if provided
    if (type && type !== "all") {
      history = history.filter((entry) => entry.type === type);
    }

    // Sort by date (newest first)
    history = history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedHistory = history.slice(startIndex, endIndex);

    res.status(200).json({
      currentBalance: user.xenoCoins,
      history: paginatedHistory,
      totalEntries: history.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(history.length / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching XenoCoin history:", error);
    res.status(500).json({
      message: "Failed to fetch XenoCoin history",
      error: error.message,
    });
  }
};

// Get all users with XenoCoin stats (Admin only)
const getUsersWithXenoCoinStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter)
      .select("name email googleId xenoCoins xenoCoinHistory createdAt")
      .sort({ xenoCoins: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const usersWithStats = users.map((user) => ({
      ...user.toObject(),
      totalEarned: user.xenoCoinHistory
        .filter(
          (entry) => entry.type === "earn" || entry.type === "admin_credit"
        )
        .reduce((sum, entry) => sum + entry.amount, 0),
      totalSpent: user.xenoCoinHistory
        .filter(
          (entry) => entry.type === "spend" || entry.type === "admin_debit"
        )
        .reduce((sum, entry) => sum + entry.amount, 0),
      transactionCount: user.xenoCoinHistory.length,
    }));
    const total = await User.countDocuments(filter);

    res.status(200).json({
      users: usersWithStats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users with XenoCoin stats",
      error: error.message,
    });
  }
};

// Test endpoint to manually award XenoCoins
const testAwardXenoCoins = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        message: "userId and amount are required",
        example: { userId: "firebase_uid", amount: 1500 },
      });
    }
    const user = await User.findOne({ googleId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const coinsAwarded = await awardXenoCoins(
      userId,
      "test_order_" + Date.now(),
      parseFloat(amount)
    );

    res.status(200).json({
      message: "Test XenoCoin award completed",
      user: user.email,
      amountSpent: amount,
      coinsAwarded: coinsAwarded,
      calculation: `${amount} NPR ÷ 1000 = ${coinsAwarded} XenoCoins`,
    });
  } catch (error) {
    res.status(500).json({ message: "Test failed", error: error.message });
  }
};

// Test endpoint to manually trigger order delivery and XenoCoin award
const testOrderDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
        instruction: "Provide a real order ID from your database",
      });
    }
    const Order = require("../order/order.model");
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Simulate the XenoCoin award process
    const user = await User.findOne({ googleId: order.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found for this order" });
    }

    const orderAmount =
      order.order.price ||
      order.order.totalAmount ||
      order.order.amount ||
      order.order.cost ||
      0;

    if (orderAmount > 0) {
      const coinsAwarded = await awardXenoCoins(
        order.userId,
        order._id,
        orderAmount
      );

      res.status(200).json({
        message: "Test order delivery completed",
        order: {
          id: orderId,
          userId: order.userId,
          userEmail: user.email,
          orderAmount: orderAmount,
          coinsAwarded: coinsAwarded,
          orderDetails: order.order,
        },
      });
    } else {
      res.status(400).json({
        message: "Order amount is 0 or undefined",
        orderDetails: order.order,
        suggestion: "Check how order prices are stored in your frontend",
      });
    }
  } catch (error) {
    console.error("Error in test order delivery:", error);
    res.status(500).json({ message: "Test failed", error: error.message });
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
  getUserByGoogleId,
  // XenoCoin functions
  awardXenoCoins,
  adminModifyXenoCoins,
  getXenoCoinHistory,
  getUsersWithXenoCoinStats,
  testAwardXenoCoins,
  testOrderDelivery,
  testOrderDelivery,
};
