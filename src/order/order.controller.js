const Order = require("./order.model");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { order, paymentMethod, paymentScreenshot, userId } = req.body;
    // If userId is a string but not a valid ObjectId, set to undefined
    let userIdToSave = undefined;
    if (
      userId &&
      typeof userId === "string" &&
      userId.match(/^[0-9a-fA-F]{24}$/)
    ) {
      userIdToSave = userId;
    }
    const newOrder = await Order.create({
      userId: userIdToSave,
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
      .skip((page - 1) * limit)
      .populate("userId", "name email");

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    res.json({
      orders,
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
    const userId = req.user ? req.user._id : req.params.userId;
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
    ).populate("userId", "name email");

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
