const Order = require("../order/order.model");
const ManualEntry = require("./manualEntry.model");
const Product = require("../product/product.model");

// Import the profit calculation function from order controller
// We'll create a shared utility for this
const calculateOrderProfitData = async (orderItems, couponDiscount = 0) => {
  try {
    console.log("🔍 Debug: calculateOrderProfitData called with:", {
      orderItems,
      couponDiscount,
    });

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
      console.log("🔍 Processing single order without productId:", orderItems);

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
          );

          // Try to match by price first, then by quantity
          const matchingQty =
            product.productQuantity.find((pq) => pq.price === sellingPrice) ||
            product.productQuantity.find(
              (pq) => pq.quantity === quantity.toString()
            ) ||
            product.productQuantity.find(
              (pq) => parseInt(pq.quantity) === quantity
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
      }

      const itemRevenue = sellingPrice * quantity;
      const itemCost = costPrice * quantity;
      const itemProfit = itemRevenue - itemCost;

      totalRevenue += itemRevenue;
      totalCost += itemCost;

      itemProfits.push({
        title: orderItems.title,
        quantity,
        sellingPrice,
        costPrice,
        profit: itemProfit,
      });

      console.log("✅ Processed order:", {
        quantity,
        sellingPrice,
        costPrice,
        itemRevenue,
        itemCost,
        itemProfit,
      });

      // Apply coupon discount to revenue
      const finalRevenue = Math.max(0, totalRevenue - couponDiscount);
      const totalProfit = finalRevenue - totalCost;

      return {
        totalCost,
        totalRevenue: finalRevenue,
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
        }

        const itemRevenue = sellingPrice * quantity;
        const itemCost = costPrice * quantity;
        const itemProfit = itemRevenue - itemCost;

        totalRevenue += itemRevenue;
        totalCost += itemCost;

        itemProfits.push({
          productId: item.productId,
          quantity,
          sellingPrice,
          costPrice,
          profit: itemProfit,
        });
      } catch (itemError) {
        console.error(
          `Error calculating profit for item ${item.productId}:`,
          itemError
        );
      }
    }

    // Apply coupon discount to revenue
    const finalRevenue = Math.max(0, totalRevenue - couponDiscount);
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

// Get financial summary/stats for admin dashboard
const getFinancialStats = async (req, res) => {
  try {
    const { startDate, endDate, timeframe = "all" } = req.query;

    let dateFilter = {};
    const now = new Date();

    // Calculate date range based on timeframe
    switch (timeframe) {
      case "today":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        };
        break;
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = {
          createdAt: {
            $gte: new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate()
            ),
            $lt: new Date(),
          },
        };
        break;
      case "month":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        };
        break;
      case "custom":
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000), // Add 1 day to include end date
            },
          };
        }
        break;
    } // Get completed orders with profit data
    const orders = await Order.find({
      ...dateFilter,
      status: { $in: ["completed", "delivered"] }, // Only completed orders
    });

    console.log(
      `📊 Finance Stats Debug - Found ${orders.length} delivered/completed orders for timeframe: ${timeframe}`
    ); // Debug: Show all orders regardless of status for comparison
    const allOrders = await Order.find(dateFilter);
    console.log(`📊 Total orders in timeframe: ${allOrders.length}`);
    console.log(
      "📊 Order statuses:",
      allOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {})
    );

    // Set totalOrders to all orders (not just completed/delivered)
    const totalOrders = allOrders.length;

    // Debug: Log orders without profit data
    const ordersWithoutProfit = orders.filter((order) => !order.profitData);
    if (ordersWithoutProfit.length > 0) {
      console.log(
        `⚠️  Found ${ordersWithoutProfit.length} orders without profit data:`,
        ordersWithoutProfit.map((o) => ({
          id: o._id,
          status: o.status,
          createdAt: o.createdAt,
        }))
      );
    }

    // Calculate order-based financial data
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let orderCount = orders.length;

    orders.forEach((order) => {
      if (order.profitData) {
        totalRevenue += order.profitData.totalRevenue || 0;
        totalCost += order.profitData.totalCost || 0;
        totalProfit += order.profitData.totalProfit || 0;
      }
    });

    // Get manual entries for the same period
    const manualEntries = await ManualEntry.find({
      ...(dateFilter.createdAt ? { date: dateFilter.createdAt } : {}),
    });

    let manualIncome = 0;
    let manualExpenses = 0;

    manualEntries.forEach((entry) => {
      if (entry.type === "income") {
        manualIncome += entry.amount;
      } else {
        manualExpenses += entry.amount;
      }
    });

    // Calculate net profit including manual entries
    const netProfit = totalProfit + manualIncome - manualExpenses;

    // Get best-selling products by profit
    const productProfitMap = new Map();

    orders.forEach((order) => {
      if (order.profitData && order.profitData.itemProfits) {
        order.profitData.itemProfits.forEach((item) => {
          const productId = item.productId;
          const currentProfit = productProfitMap.get(productId) || 0;
          productProfitMap.set(productId, currentProfit + (item.profit || 0));
        });
      }
    });

    // Convert map to array and sort by profit
    const productProfits = Array.from(productProfitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 products

    // Get product details for top profitable products
    const topProducts = await Promise.all(
      productProfits.map(async ([productId, profit]) => {
        try {
          const product = await Product.findById(productId);
          return {
            productId,
            title: product?.title || "Product Not Found",
            totalProfit: profit,
          };
        } catch (err) {
          return {
            productId,
            title: "Product Not Found",
            totalProfit: profit,
          };
        }
      })
    );
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          manualIncome,
          manualExpenses,
          netProfit,
          orderCount,
          totalOrders, // Add all orders count (including pending, etc.)
        },
        topProfitableProducts: topProducts,
        timeframe,
        dateRange: dateFilter.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create manual income/expense entry
const createManualEntry = async (req, res) => {
  try {
    const { type, description, amount, category, date } = req.body;
    const createdBy = req.user.uid; // From admin auth middleware

    // Validate required fields
    if (!type || !description || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Type, description, amount, and category are required",
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const manualEntry = new ManualEntry({
      type,
      description,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      createdBy,
    });

    await manualEntry.save();

    res.status(201).json({
      success: true,
      message: "Manual entry created successfully",
      data: manualEntry,
    });
  } catch (error) {
    console.error("Error creating manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get manual entries with filtering
const getManualEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, startDate, endDate } = req.query;

    let filter = {};

    if (type) {
      filter.type = type;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await ManualEntry.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ManualEntry.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEntries: total,
          hasNext: skip + entries.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching manual entries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update manual entry
const updateManualEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, amount, category, date } = req.body;

    const entry = await ManualEntry.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Manual entry not found",
      });
    }

    // Update fields
    if (type) entry.type = type;
    if (description) entry.description = description;
    if (amount) entry.amount = amount;
    if (category) entry.category = category;
    if (date) entry.date = new Date(date);

    await entry.save();

    res.status(200).json({
      success: true,
      message: "Manual entry updated successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Error updating manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete manual entry
const deleteManualEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await ManualEntry.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Manual entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Manual entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting manual entry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Recalculate profit data for orders missing it
const recalculateOrderProfits = async (req, res) => {
  try {
    console.log("🔄 Starting profit data recalculation for orders...");

    // Find orders without profit data
    const ordersWithoutProfit = await Order.find({
      status: { $in: ["delivered", "completed"] },
      profitData: { $exists: false },
    });

    console.log(
      `Found ${ordersWithoutProfit.length} delivered orders without profit data`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const order of ordersWithoutProfit) {
      try {
        const couponDiscount = order.coupon?.discountAmount || 0;
        const profitData = await calculateOrderProfitData(
          order.order,
          couponDiscount
        );

        if (profitData) {
          order.profitData = profitData;
          await order.save();
          successCount++;
          console.log(`✅ Fixed order ${order._id}`);
        } else {
          errorCount++;
          console.log(`❌ Failed to calculate profit for order ${order._id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error fixing order ${order._id}:`, error);
      }
    }

    res.json({
      message: "Profit data recalculation completed",
      results: {
        total: ordersWithoutProfit.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Error in recalculateOrderProfits:", error);
    res.status(500).json({ error: "Failed to recalculate order profits" });
  }
};

// Force recalculate profit data for all delivered orders (even if they already have profit data)
const forceRecalculateOrderProfits = async (req, res) => {
  try {
    console.log(
      "🔄 Starting FORCE profit data recalculation for all delivered orders..."
    );

    // Find all delivered orders
    const deliveredOrders = await Order.find({
      status: { $in: ["delivered", "completed"] },
    });

    console.log(
      `Found ${deliveredOrders.length} delivered orders for force recalculation`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const order of deliveredOrders) {
      try {
        const couponDiscount = order.coupon?.discountAmount || 0;
        const profitData = await calculateOrderProfitData(
          order.order,
          couponDiscount
        );

        if (profitData) {
          order.profitData = profitData;
          await order.save();
          successCount++;
          console.log(`✅ Force recalculated order ${order._id}:`, profitData);
        } else {
          errorCount++;
          console.log(`❌ Failed to calculate profit for order ${order._id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error force recalculating order ${order._id}:`, error);
      }
    }

    res.json({
      message: "Force profit data recalculation completed",
      results: {
        total: deliveredOrders.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Error in forceRecalculateOrderProfits:", error);
    res
      .status(500)
      .json({ error: "Failed to force recalculate order profits" });
  }
};

// Reset all financial data for fresh tracking
const resetAllFinancialData = async (req, res) => {
  try {
    console.log("🔄 Starting complete financial data reset...");

    // Delete all orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`📦 Deleted ${deletedOrders.deletedCount} orders`);

    // Delete all manual entries
    const deletedEntries = await ManualEntry.deleteMany({});
    console.log(`💰 Deleted ${deletedEntries.deletedCount} manual entries`);

    res.json({
      success: true,
      message: "All financial data has been reset successfully",
      results: {
        ordersDeleted: deletedOrders.deletedCount,
        manualEntriesDeleted: deletedEntries.deletedCount,
      },
    });

    console.log("✅ Financial data reset completed successfully");
  } catch (error) {
    console.error("Error resetting financial data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset financial data",
      message: error.message,
    });
  }
};

module.exports = {
  getFinancialStats,
  createManualEntry,
  getManualEntries,
  updateManualEntry,
  deleteManualEntry,
  recalculateOrderProfits,
  forceRecalculateOrderProfits,
  resetAllFinancialData,
};
