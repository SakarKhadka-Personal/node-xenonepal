const mongoose = require("mongoose");

const manualEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "affiliate",
      "sponsorship",
      "bonus",
      "other-income",
      "shipping",
      "salaries",
      "advertising",
      "utilities",
      "office",
      "other-expense",
    ],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String, // Firebase UID of admin who created this entry
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for better query performance
manualEntrySchema.index({ type: 1, date: -1 });
manualEntrySchema.index({ createdBy: 1 });

module.exports = mongoose.model("ManualEntry", manualEntrySchema);
