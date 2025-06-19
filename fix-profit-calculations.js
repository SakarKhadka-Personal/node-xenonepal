/**
 * This script forces a recalculation of all profit data for delivered orders.
 * It will correct the profit calculations, particularly for orders with coupon discounts.
 */

// Load environment variables
require("dotenv").config();

const mongoose = require("mongoose");
const Order = require("./src/order/order.model");
const Product = require("./src/product/product.model");

// Define the calculation function directly since importing from controller might have circular dependency issues
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

      console.log("✅ Processed order:", {
        quantity,
        originalPrice,
        finalPrice,
        costPrice,
        couponDiscount,
        revenue: totalRevenue,
        itemCost,
        totalProfit,
        profitMargin:
          totalRevenue > 0
            ? ((totalProfit / totalRevenue) * 100).toFixed(2) + "%"
            : "0%",
      }); // Calculate the final profit
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
        }

        // Calculate item revenue and cost
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
    }

    // Apply coupon discount to revenue and recalculate profits
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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/xenonepal")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function recalculateAllProfits() {
  try {
    console.log(
      "🔄 Starting profit data recalculation for all delivered orders..."
    );

    // Find all delivered or completed orders
    const deliveredOrders = await Order.find({
      status: { $in: ["delivered", "completed"] },
    });

    console.log(
      `Found ${deliveredOrders.length} delivered/completed orders for recalculation`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const order of deliveredOrders) {
      try {
        const couponDiscount = order.coupon?.discountAmount || 0;

        // Use the updated calculation logic from the controller
        const profitData = await calculateOrderProfitData(
          order.order,
          couponDiscount
        );

        if (profitData) {
          order.profitData = profitData;
          await order.save();
          successCount++;
          console.log(`✅ Recalculated profit for order ${order._id}`);
          console.log(`  Original revenue: ${order.order.price}`);
          console.log(`  Cost price: ${profitData.totalCost}`);
          console.log(`  Coupon discount: ${couponDiscount}`);
          console.log(
            `  Final revenue after discount: ${profitData.totalRevenue}`
          );
          console.log(`  Total profit: ${profitData.totalProfit}`);
          console.log(
            `  Profit margin: ${(
              (profitData.totalProfit / profitData.totalRevenue) *
              100
            ).toFixed(2)}%`
          );
        } else {
          errorCount++;
          console.log(`❌ Failed to calculate profit for order ${order._id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error recalculating order ${order._id}:`, error);
      }
    }

    console.log("✅ Profit recalculation completed");
    console.log(`Total orders: ${deliveredOrders.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Error in recalculation script:", error);
    process.exit(1);
  }
}

// Run the recalculation
recalculateAllProfits();
