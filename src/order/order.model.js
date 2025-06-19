const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed to String to store Firebase UID
    required: true,
    index: true,
  },
  order: { type: Object, required: true },
  paymentMethod: { type: String, required: true },
  paymentScreenshot: { type: String },
  status: { type: String, default: "pending" },
  coupon: {
    code: { type: String },
    discountAmount: { type: Number },
    discountType: { type: String, enum: ["flat", "percentage"] },
  },
  // Profit tracking fields (admin-only)
  profitData: {
    totalCost: { type: Number, default: 0 }, // Sum of (costPrice * quantity) for all items
    totalRevenue: { type: Number, default: 0 }, // Total amount paid by customer
    totalProfit: { type: Number, default: 0 }, // totalRevenue - totalCost
    itemProfits: [
      {
        productId: { type: String },
        quantity: { type: Number },
        sellingPrice: { type: Number },
        costPrice: { type: Number },
        profit: { type: Number }, // (sellingPrice - costPrice) * quantity
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
