const Order = require("./order.model");
const User = require("../user/user.model");
const Coupon = require("../coupon/coupon.model");
const emailService = require("../email/emailService");
const { awardXenoCoins } = require("../user/user.controller");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { order, paymentMethod, paymentScreenshot, userId, coupon } =
      req.body;

    // Create order object with base properties
    const orderData = {
      userId, // Store Firebase UID directly
      order,
      paymentMethod,
      paymentScreenshot,
    };

    // Add coupon information if provided
    if (coupon && coupon.code) {
      orderData.coupon = {
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        discountType: coupon.discountType,
      };
    }

    const newOrder = await Order.create(orderData); // Record coupon usage AFTER order creation
    if (coupon && coupon.code) {
      try {
        // Record coupon usage directly in database
        const couponDoc = await Coupon.findOne({
          code: coupon.code.toUpperCase(),
        });
        if (couponDoc) {
          // Double-check limits before recording usage (race condition protection)
          const userUsageCount = couponDoc.usedBy.filter(
            (usage) => usage.userId === userId
          ).length;

          if (userUsageCount >= couponDoc.usagePerUser) {
            console.warn(
              `User ${userId} attempted to exceed per-user limit for coupon ${coupon.code}`
            );
            // Don't record usage but don't fail the order
            return;
          }

          if (couponDoc.usedBy.length >= couponDoc.usageLimit) {
            console.warn(`Coupon ${coupon.code} usage limit exceeded`);
            // Don't record usage but don't fail the order
            return;
          }

          couponDoc.usedBy.push({
            userId,
            orderId: newOrder._id,
            date: new Date(),
            discountAmount: coupon.discountAmount,
          });
          await couponDoc.save();
          console.log(
            `Coupon usage recorded for ${
              coupon.code
            } by user ${userId}. Total uses: ${couponDoc.usedBy.length}/${
              couponDoc.usageLimit
            }, User uses: ${userUsageCount + 1}/${couponDoc.usagePerUser}`
          );
        } else {
          console.warn(
            `Coupon ${coupon.code} not found when trying to record usage`
          );
        }
      } catch (couponError) {
        console.error("Failed to record coupon usage:", couponError);
        // Don't fail the order creation if coupon recording fails
      }
    }

    // Send order confirmation email to customer
    try {
      const user = await User.findOne({ googleId: userId });
      if (user && user.email) {
        // Calculate final amount with coupon discount if applicable
        const originalAmount = order.price || order.totalAmount;
        const discountAmount = orderData.coupon
          ? orderData.coupon.discountAmount
          : 0;
        const finalAmount = originalAmount - discountAmount;

        // Send customer confirmation email
        await emailService.sendOrderCompletionEmail(user.email, {
          userName: user.name,
          orderId: newOrder._id.toString().slice(-8),
          productName: order.title || "Gaming Product",
          quantity: order.quantity || 1,
          totalAmount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          couponCode: orderData.coupon ? orderData.coupon.code : null,
          currency: order.currency || "NPR",
          paymentMethod: paymentMethod || "Not specified",
          playerID: order.playerID,
          username: order.username,
          createdAt: newOrder.createdAt,
        });

        // Send admin notification for new order (optimized - runs in background)
        setImmediate(() => {
          emailService
            .sendAdminNewOrderNotification({
              orderId: newOrder._id.toString().slice(-8),
              customerName: user.name,
              customerEmail: user.email,
              productName: order.title || "Gaming Product",
              quantity: order.quantity || 1,
              totalAmount: finalAmount,
              originalAmount: originalAmount,
              discountAmount: discountAmount,
              couponCode: orderData.coupon ? orderData.coupon.code : null,
              currency: order.currency || "NPR",
              playerID: order.playerID,
              username: order.username,
              paymentMethod: paymentMethod || "Not specified",
              createdAt: newOrder.createdAt,
            })
            .catch((error) => {
              console.error(
                "Failed to send admin new order notification:",
                error
              );
            });
        });
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Don't fail the order creation if email fails
    }

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
    const { page = 1, limit = 10, status, search } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status.toLowerCase();
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: "i" } },
        { "order.username": { $regex: search, $options: "i" } },
        { "order.playerID": { $regex: search, $options: "i" } },
        { "order.title": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
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

    // For search, also search within user information if needed
    let finalOrdersWithUserInfo = ordersWithUserInfo;
    if (search && !status) {
      // Additional filtering for user-related search terms
      finalOrdersWithUserInfo = ordersWithUserInfo.filter((order) => {
        const searchTerm = search.toLowerCase();

        // Search in order fields
        const orderMatch = [
          order._id?.toString(),
          order.order?.username,
          order.order?.playerID,
          order.order?.title,
          order.status,
        ].some((field) => field?.toLowerCase().includes(searchTerm));

        // Search in user info
        const userMatch =
          order.userInfo &&
          [order.userInfo.name, order.userInfo.email].some((field) =>
            field?.toLowerCase().includes(searchTerm)
          );

        return orderMatch || userMatch;
      });
    }

    // Get total count for pagination (without search filtering for user info)
    const total = await Order.countDocuments(filter); // Get status counts for all orders (not just filtered ones)
    const [totalDelivered, totalPending, totalCancelled] = await Promise.all([
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "cancelled" }),
    ]);

    res.json({
      orders: finalOrdersWithUserInfo,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      statusCounts: {
        delivered: totalDelivered,
        pending: totalPending,
        cancelled: totalCancelled,
      },
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

    const validStatuses = ["pending", "delivered", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send response immediately for better performance
    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    }); // Send email notifications asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const user = await User.findOne({ googleId: updatedOrder.userId });
        if (user && user.email) {
          // Award XenoCoins for delivered orders
          if (status.toLowerCase() === "delivered") {
            // Try multiple ways to get the order amount
            const orderAmount =
              updatedOrder.order.price ||
              updatedOrder.order.totalAmount ||
              updatedOrder.order.amount ||
              updatedOrder.order.cost ||
              0;

            console.log("Order data for XenoCoin calculation:", {
              orderId: updatedOrder._id,
              userId: updatedOrder.userId,
              orderObject: updatedOrder.order,
              extractedAmount: orderAmount,
            });

            if (orderAmount > 0) {
              const coinsAwarded = await awardXenoCoins(
                updatedOrder.userId,
                updatedOrder._id,
                orderAmount
              );

              console.log(
                `✅ Awarded ${coinsAwarded} XenoCoins to user ${user.email} for order ${updatedOrder._id} (Amount: NPR ${orderAmount})`
              );
            } else {
              console.log(
                `❌ No XenoCoins awarded - Order amount is 0 or undefined for order ${updatedOrder._id}`
              );
            }

            // Send customer delivery notification for delivered orders
            await emailService.sendOrderDeliveredEmail(user.email, {
              userName: user.name,
              orderId: updatedOrder._id.toString().slice(-8),
              productName: updatedOrder.order.title || "Gaming Product",
              quantity: updatedOrder.order.quantity || 1,
              totalAmount:
                updatedOrder.order.price || updatedOrder.order.totalAmount,
              currency: updatedOrder.order.currency || "NPR",
              paymentMethod: updatedOrder.paymentMethod || "Not specified",
              playerID: updatedOrder.order.playerID,
              username: updatedOrder.order.username,
            });
          }

          // Send admin notification for status update
          await emailService.sendAdminOrderStatusUpdate(
            {
              orderId: updatedOrder._id.toString().slice(-8),
              customerName: user.name,
              customerEmail: user.email,
              productName: updatedOrder.order.title || "Gaming Product",
              totalAmount:
                updatedOrder.order.price || updatedOrder.order.totalAmount,
              currency: updatedOrder.order.currency || "NPR",
              paymentMethod: updatedOrder.paymentMethod || "Not specified",
              playerID: updatedOrder.order.playerID,
              username: updatedOrder.order.username,
            },
            "previous_status",
            status.toLowerCase()
          );
        }
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError);
        // Email failure doesn't affect the status update
      }
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
