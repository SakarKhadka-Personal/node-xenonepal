const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  discountType: {
    type: String,
    required: true,
    enum: ["flat", "percentage"],
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    min: 0,
    default: 0, // Only applicable for percentage discounts
  },
  validFor: {
    type: String,
    required: true,
    enum: ["all", "user", "product"],
    default: "all",
  },
  users: [
    {
      type: String, // Firebase UIDs
    },
  ],
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  usageLimit: {
    type: Number,
    required: true,
    min: 1,
  },
  usagePerUser: {
    type: Number,
    required: true,
    min: 1,
  },
  usedBy: [
    {
      userId: {
        type: String,
        required: true,
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      discountAmount: {
        type: Number,
        required: true,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field to check if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiresAt;
});

// Virtual field to get the total number of times the coupon has been used
couponSchema.virtual("totalUsed").get(function () {
  return this.usedBy.length;
});

// Virtual field to check if coupon has exceeded its usage limit
couponSchema.virtual("hasReachedLimit").get(function () {
  return this.usedBy.length >= this.usageLimit;
});

// Method to check if a user can use this coupon
couponSchema.methods.canBeUsedBy = function (userId) {
  // Check if coupon is for specific users
  if (this.validFor === "user" && !this.users.includes(userId)) {
    return false;
  }

  // Check user usage limit
  const userUsageCount = this.usedBy.filter(
    (usage) => usage.userId === userId
  ).length;
  return userUsageCount < this.usagePerUser;
};

// Method to check if a coupon can be applied to a product
couponSchema.methods.canBeAppliedTo = function (productId) {
  // If coupon is for all products or specific users, it can be applied to any product
  if (this.validFor === "all" || this.validFor === "user") {
    return true;
  }

  // If coupon is for specific products, check if the product is included
  return this.products.some((id) => id.toString() === productId.toString());
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (cartTotal) {
  if (this.discountType === "flat") {
    return Math.min(this.discountValue, cartTotal);
  } else {
    // For percentage discount
    const calculatedDiscount = (cartTotal * this.discountValue) / 100;
    // Apply maximum discount cap if set (for percentage discounts)
    return this.maxDiscount > 0
      ? Math.min(calculatedDiscount, this.maxDiscount)
      : calculatedDiscount;
  }
};

// Set toJSON to include virtuals
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
