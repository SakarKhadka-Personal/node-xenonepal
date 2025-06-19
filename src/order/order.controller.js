const Order = require("./order.model");
const User = require("../user/user.model");
const Product = require("../product/product.model");
const Coupon = require("../coupon/coupon.model");
const emailService = require("../email/emailService");
const { awardXenoCoins } = require("../user/user.controller");
const ManualEntry = require("../finance/manualEntry.model");

// Helper function to calculate profit data for an order
const calculateOrderProfitData = async (orderItems, couponDiscount = 0) => {
  try {
    let totalCost = 0;
    let totalRevenue = 0;
    const itemProfits = [];

    // Handle different order data structures
    let items = [];
    if (Array.isArray(orderItems)) {
      items = orderItems;
    } else if (orderItems.productId) {
      // Single item order with productId
      items = [orderItems];
    } else if (orderItems.title && orderItems.price) {
      // Handle the current order structure: single order object without productId

      // Extract quantity number from string like "322 (x 1)" or just use 1
      let quantity = 1;
      if (orderItems.quantity && typeof orderItems.quantity === "string") {
        const match = orderItems.quantity.match(/\d+/);
        if (match) {
          quantity = parseInt(match[0]);
        }
      } else if (typeof orderItems.quantity === "number") {
        quantity = orderItems.quantity;
      }

      const sellingPrice = orderItems.price || 0;

      // Try to find the product by title to get cost price
      let costPrice = 0;
      try {
        console.log(
          `🔍 Searching for product with title: "${orderItems.title}" and price: ${sellingPrice}`
        );

        const product = await Product.findOne({
          title: { $regex: new RegExp(orderItems.title.trim(), "i") }, // Case-insensitive search
        });

        if (
          product &&
          product.productQuantity &&
          product.productQuantity.length > 0
        ) {
          console.log(
            `✅ Found product: ${product.title} with ${product.productQuantity.length} quantity options`
          ); // Try to match by price first (try both original price and current price), then by quantity
          const sellingPriceAlt = orderItems.originalPrice || sellingPrice;
          const matchingQty =
            product.productQuantity.find((pq) => pq.price === sellingPrice) ||
            product.productQuantity.find(
              (pq) => pq.price === sellingPriceAlt
            ) ||
            product.productQuantity.find(
              (pq) => pq.quantity === quantity.toString()
            ) ||
            product.productQuantity.find(
              (pq) => parseInt(pq.quantity) === quantity
            ) ||
            product.productQuantity.find(
              (pq) => pq.quantity.toString() === orderItems.stack
            );

          if (matchingQty && matchingQty.costPrice) {
            costPrice = matchingQty.costPrice;
            console.log(
              `✅ Found matching cost price: ${costPrice} for price: ${sellingPrice}, quantity: ${quantity}`
            );
          } else {
            console.warn(
              `⚠️ No matching cost price found for price: ${sellingPrice}, quantity: ${quantity}`
            );
            console.log(
              "Available options:",
              product.productQuantity.map((pq) => ({
                quantity: pq.quantity,
                price: pq.price,
                costPrice: pq.costPrice,
              }))
            );
          }
        } else {
          console.warn(`⚠️ Product not found for title: "${orderItems.title}"`);
        }
      } catch (productError) {
        console.error(
          "Error finding product for cost calculation:",
          productError
        );
      } // IMPORTANT: orderItems.price is already the TOTAL PRICE (unit price × quantity)
      // So we should NOT multiply by quantity again
      const originalPrice = orderItems.originalPrice || sellingPrice;
      const finalPrice = sellingPrice; // This is already the total price

      // Calculate the revenue correctly: Revenue = Final Price (already total)
      // ❌ OLD (WRONG): const itemRevenue = finalPrice * quantity;
      // ✅ NEW (CORRECT): const itemRevenue = finalPrice;
      const itemRevenue = finalPrice; // finalPrice is already total price

      // For cost calculation, we need to find the unit cost price and multiply by quantity
      const itemCost = costPrice * quantity;

      // The total revenue is the final revenue (no need to subtract discount again)
      totalRevenue += itemRevenue;
      totalCost += itemCost;

      // Net Profit = Revenue - Cost Price
      const totalProfit = totalRevenue - totalCost;

      itemProfits.push({
        title: orderItems.title,
        quantity,
        sellingPrice: finalPrice,
        originalPrice,
        costPrice,
        revenue: totalRevenue, // Final revenue (already after discount)
        profit: totalProfit, // Total profit
      });

      // Calculate the final profit
      // totalProfit is already calculated above

      return {
        totalCost,
        totalRevenue: totalRevenue,
        totalProfit,
        itemProfits,
      };
    } else {
      console.warn(
        "Unable to parse order items for profit calculation:",
        orderItems
      );
      return null;
    }

    // Process items with productId (for future compatibility)
    for (const item of items) {
      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.warn(
            `Product not found for profit calculation: ${item.productId}`
          );
          continue;
        }

        const quantity = item.quantity || 1;
        const sellingPrice = item.price || item.totalPrice || 0;

        // Find matching product quantity to get cost price
        let costPrice = 0;
        if (product.productQuantity && product.productQuantity.length > 0) {
          const matchingQty = product.productQuantity.find(
            (pq) =>
              pq.quantity === item.selectedQuantity || pq.price === sellingPrice
          );
          costPrice = matchingQty?.costPrice || 0;
        } // Calculate item revenue and cost
        const itemRevenue = sellingPrice * quantity;
        const itemCost = costPrice * quantity;

        // Add to totals
        totalRevenue += itemRevenue;
        totalCost += itemCost;

        // Store the original calculation for now, will be updated after all items are processed
        itemProfits.push({
          productId: item.productId,
          quantity,
          sellingPrice,
          costPrice,
          originalRevenue: itemRevenue,
          profit: 0, // Will be calculated after coupon is applied
        });
      } catch (itemError) {
        console.error(
          `Error calculating profit for item ${item.productId}:`,
          itemError
        );
      }
    } // Apply coupon discount to revenue and recalculate profits
    const finalRevenue = Math.max(0, totalRevenue - couponDiscount);

    // If there are multiple items, distribute the discount proportionally
    if (itemProfits.length > 0) {
      for (let i = 0; i < itemProfits.length; i++) {
        const item = itemProfits[i];
        const originalRevenue =
          item.originalRevenue || item.sellingPrice * item.quantity;

        // Calculate the proportion of the total revenue this item represents
        const revenueProportion = originalRevenue / totalRevenue;

        // Apply that proportion of the discount to this item
        const itemRevenueAfterDiscount =
          couponDiscount > 0
            ? revenueProportion * finalRevenue
            : originalRevenue;

        // Update the item profit calculation
        const itemProfit =
          itemRevenueAfterDiscount - item.costPrice * item.quantity;

        // Update the item profit in the array
        itemProfits[i].revenue = itemRevenueAfterDiscount;
        itemProfits[i].profit = itemProfit;

        // Remove the temporary originalRevenue property
        delete itemProfits[i].originalRevenue;
      }
    }

    const totalProfit = finalRevenue - totalCost;

    return {
      totalCost,
      totalRevenue: finalRevenue,
      totalProfit,
      itemProfits,
    };
  } catch (error) {
    console.error("Error calculating order profit data:", error);
    return null;
  }
};

// Helper function to recalculate profit data for orders missing it
const recalculateProfitForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found`);
      return false;
    }

    if (order.profitData) {
      console.log(`Order ${orderId} already has profit data`);
      return true;
    }

    // Calculate profit data
    const couponDiscount = order.coupon?.discountAmount || 0;
    const profitData = await calculateOrderProfitData(
      order.order,
      couponDiscount
    );

    if (profitData) {
      order.profitData = profitData;
      await order.save();
      console.log(
        `✅ Successfully recalculated profit data for order ${orderId}`
      );
      return true;
    } else {
      console.log(`❌ Failed to calculate profit data for order ${orderId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error recalculating profit for order ${orderId}:`, error);
    return false;
  }
};

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
    let couponDiscountAmount = 0;
    if (coupon && coupon.code) {
      orderData.coupon = {
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        discountType: coupon.discountType,
      };
      couponDiscountAmount = coupon.discountAmount || 0;
    } // Calculate profit data for this order
    const profitData = await calculateOrderProfitData(
      order,
      couponDiscountAmount
    );
    if (profitData) {
      orderData.profitData = profitData;
    } else {
      console.warn("⚠️ Failed to calculate profit data for new order");
    }

    const newOrder = await Order.create(orderData);

    console.log("📦 New order created:", {
      id: newOrder._id,
      status: newOrder.status,
      hasProfitData: !!newOrder.profitData,
      orderData: order,
    }); // Record coupon usage AFTER order creation
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
        const finalAmount = originalAmount - discountAmount; // Send customer confirmation email
        await emailService.sendOrderCompletionEmail(user.email, {
          userName: user.name,
          orderId: newOrder._id.toString().slice(-8),
          productName: order.title || "Gaming Product",
          quantity: order.quantity || 1,
          totalAmount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          couponCode: orderData.coupon ? orderData.coupon.code : null,
          currency: "NPR",
          paymentMethod: paymentMethod || "Not specified",
          playerID: order.playerID,
          username: order.username,
          billingName: user.name,
          billingEmail: user.email,
          billingPhone: user.phone || "Not provided",
          createdAt: newOrder.createdAt,
        }); // Send admin notification for new order (optimized - runs in background)
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
              currency: "NPR",
              playerID: order.playerID,
              username: order.username,
              paymentMethod: paymentMethod || "Not specified",
              billingName: user.name,
              billingEmail: user.email,
              billingPhone: user.phone || "Not provided",
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
    const { page = 1, limit = 10, status, search } = req.query; // Build filter object
    const filter = {};
    if (status) {
      filter.status = status.toLowerCase();
    }

    // For searching in user information, we need to handle it differently
    let userIds = [];
    if (search) {
      // First, find users that match the search term
      try {
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }).select("googleId");
        userIds = users.map((user) => user.googleId);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    }

    // Add search functionality
    if (search) {
      const searchConditions = [
        { "order.username": { $regex: search, $options: "i" } },
        { "order.playerID": { $regex: search, $options: "i" } },
        { "order.title": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];

      // Add user search condition if we found matching users
      if (userIds.length > 0) {
        searchConditions.push({ userId: { $in: userIds } });
      }

      // Try to search by ObjectId if the search term could be a valid ObjectId
      if (search.match(/^[0-9a-fA-F]{24}$/) || search.length >= 8) {
        // Add partial ObjectId search (convert to string first)
        searchConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: search,
              options: "i",
            },
          },
        });
      }

      filter.$or = searchConditions;
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
    const total = await Order.countDocuments(filter); // Get status counts for all orders (not just filtered ones)
    const [totalDelivered, totalPending, totalCancelled] = await Promise.all([
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "cancelled" }),
    ]);
    res.json({
      orders: ordersWithUserInfo,
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

    // Get the current order
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If marking as delivered and no profit data exists, calculate it now
    if (status.toLowerCase() === "delivered" && !currentOrder.profitData) {
      console.log(
        `🔄 Calculating profit data for order ${id} before marking as delivered`
      );
      const couponDiscount = currentOrder.coupon?.discountAmount || 0;
      const profitData = await calculateOrderProfitData(
        currentOrder.order,
        couponDiscount
      );

      if (profitData) {
        currentOrder.profitData = profitData;
        console.log(`✅ Profit data calculated for order ${id}:`, profitData);
      } else {
        console.warn(`⚠️ Failed to calculate profit data for order ${id}`);
      }
    }

    // Update the order status
    currentOrder.status = status.toLowerCase();
    const updatedOrder = await currentOrder.save(); // Send response immediately for better performance
    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    }); // Send email notifications asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const user = await User.findOne({ googleId: updatedOrder.userId });

        // Add order profit to transaction history when delivered
        if (
          status.toLowerCase() === "delivered" &&
          updatedOrder.profitData &&
          updatedOrder.profitData.totalProfit > 0
        ) {
          console.log(
            `Adding profit of ${updatedOrder.profitData.totalProfit} to transaction history for order ${updatedOrder._id}`
          );
          await addOrderProfitToTransactions(updatedOrder, updatedOrder.userId);
        }

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
            } // Send customer delivery notification for delivered orders
            await emailService.sendOrderDeliveredEmail(user.email, {
              userName: user.name,
              orderId: updatedOrder._id.toString().slice(-8),
              productName: updatedOrder.order.title || "Gaming Product",
              quantity: updatedOrder.order.quantity || 1,
              totalAmount:
                updatedOrder.order.price || updatedOrder.order.totalAmount,
              currency: "NPR",
              paymentMethod: updatedOrder.paymentMethod || "Not specified",
              playerID: updatedOrder.order.playerID,
              username: updatedOrder.order.username,
              billingName: user.name,
              billingEmail: user.email,
              billingPhone: user.phone || "Not provided",
            });
          } // Send admin notification for status update
          await emailService.sendAdminOrderStatusUpdate(
            {
              orderId: updatedOrder._id.toString().slice(-8),
              customerName: user.name,
              customerEmail: user.email,
              productName: updatedOrder.order.title || "Gaming Product",
              totalAmount:
                updatedOrder.order.price || updatedOrder.order.totalAmount,
              currency: "NPR",
              paymentMethod: updatedOrder.paymentMethod || "Not specified",
              playerID: updatedOrder.order.playerID,
              username: updatedOrder.order.username,
              billingName: user.name,
              billingEmail: user.email,
              billingPhone: user.phone || "Not provided",
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

// Debug endpoint to check orders and profit data
exports.debugOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

    const orderDebugInfo = recentOrders.map((order) => ({
      id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      hasProfitData: !!order.profitData,
      profitData: order.profitData,
      orderData: order.order,
    }));

    res.json({
      totalOrders: await Order.countDocuments(),
      deliveredOrders: await Order.countDocuments({ status: "delivered" }),
      pendingOrders: await Order.countDocuments({ status: "pending" }),
      ordersWithProfit: await Order.countDocuments({
        profitData: { $exists: true },
      }),
      recentOrders: orderDebugInfo,
    });
  } catch (error) {
    console.error("Debug orders error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to add order profit to transaction history
const addOrderProfitToTransactions = async (order, userId) => {
  try {
    if (!order.profitData || !order.profitData.totalProfit) {
      console.warn(`No profit data available for order ${order._id}`);
      return null;
    }

    // Create a manual income entry for the profit
    const profit = order.profitData.totalProfit;
    const productTitle = order.order.title || "Product";
    const sellingPrice = order.order.price || 0;
    const costPrice = order.profitData.totalCost || 0;
    const orderId = order._id.toString().slice(-6);

    const description = `Profit from order: ${productTitle} (ID: ${orderId}) - Selling: ${sellingPrice}, Cost: ${costPrice}`;

    const manualEntry = new ManualEntry({
      type: "income",
      description,
      amount: profit,
      category: "order-profit", // Specific category for order profits
      date: new Date(),
      createdBy: userId || "system",
    });

    await manualEntry.save();
    console.log(
      `✅ Added profit of ${profit} to transaction history for order ${order._id}`
    );

    return manualEntry;
  } catch (error) {
    console.error(
      `Error adding profit to transaction history for order ${order._id}:`,
      error
    );
    return null;
  }
};
