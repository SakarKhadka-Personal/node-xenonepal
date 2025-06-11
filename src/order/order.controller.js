const Order = require("./order.model");
const User = require("../user/user.model");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { order, paymentMethod, paymentScreenshot, userId } = req.body;
    const newOrder = await Order.create({
      userId, // Store Firebase UID directly
      order,
      paymentMethod,
      paymentScreenshot,
    });
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

// Get all orders (admin) with pagination and filtering
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status.toLowerCase();
    }

    // Get paginated results
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Enhance orders with user information
    const ordersWithUserInfo = await Promise.all(
      orders.map(async (order) => {
        try {
          const user = await User.findOne({ googleId: order.userId });
          let userInfo = null;
          if (user) {
            // Calculate user statistics
            const userOrders = await Order.find({ userId: order.userId });
            const orderCount = userOrders.length;
            const totalSpent = userOrders.reduce((sum, userOrder) => {
              return sum + (userOrder.order?.price || 0);
            }, 0);

            userInfo = {
              _id: user._id,
              name: user.name,
              email: user.email,
              photoURL: user.photoURL,
              status: user.status,
              role: user.role,
              orderCount,
              totalSpent,
            };
          }

          return {
            ...order.toObject(),
            userInfo,
          };
        } catch (err) {
          console.error(`Error fetching user for order ${order._id}:`, err);
          return {
            ...order.toObject(),
            userInfo: null,
          };
        }
      })
    );

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    res.json({
      orders: ordersWithUserInfo,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get orders for a specific user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId; // This will be the Firebase UID
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true }
    );

    if (!updatedOrder)
      return res.status(404).json({ error: "Order not found" });
    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder)
      return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
