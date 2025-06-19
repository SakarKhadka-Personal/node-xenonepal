require("./src/config/db.js");
const Order = require("./src/order/order.model");

async function debugRevenue() {
  try {
    console.log("🔍 Debugging Revenue Calculation...\n");

    // Get all completed/delivered orders
    const orders = await Order.find({
      status: { $in: ["completed", "delivered"] },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Found ${orders.length} completed/delivered orders:\n`);

    let totalRevenue = 0;
    let totalCost = 0;

    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  ID: ${order._id}`);
      console.log(`  Price: ${order.price}`);
      console.log(`  Quantity: ${order.quantity}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Created: ${order.createdAt}`);

      if (order.profitData) {
        console.log(`  Profit Data:`);
        console.log(`    Total Revenue: ${order.profitData.totalRevenue}`);
        console.log(`    Total Cost: ${order.profitData.totalCost}`);
        console.log(`    Total Profit: ${order.profitData.totalProfit}`);

        totalRevenue += order.profitData.totalRevenue || 0;
        totalCost += order.profitData.totalCost || 0;
      } else {
        console.log(`  ❌ No profit data found`);
      }
      console.log("");
    });

    console.log("=".repeat(50));
    console.log(`SUMMARY:`);
    console.log(`Total Revenue from orders: ${totalRevenue}`);
    console.log(`Total Cost from orders: ${totalCost}`);
    console.log(`Net Profit: ${totalRevenue - totalCost}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setTimeout(debugRevenue, 1000);
