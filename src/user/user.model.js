const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  photoURL: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  phone: {
    type: String,
    default: "",
  },

  // XenoCoin System
  xenoCoins: {
    type: Number,
    default: 0,
    min: 0,
  },
  xenoCoinHistory: [
    {
      type: {
        type: String,
        enum: ["earn", "spend", "admin_credit", "admin_debit"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      source: {
        type: String,
        required: true, // e.g., 'order_purchase', 'admin_action', 'bonus'
      },
      description: {
        type: String,
        default: "",
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: false,
      },
      adminId: {
        type: String, // Firebase UID of admin who performed the action
        required: false,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
userSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    this.set({ updatedAt: Date.now() });
    next();
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
