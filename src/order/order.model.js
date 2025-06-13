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
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
