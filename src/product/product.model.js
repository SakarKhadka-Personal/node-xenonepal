const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  isLoginRequired: {
    type: Boolean,
    required: true,
    default: false,
  },
  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
  },
  coverImage: {
    type: String,
    required: true,
  },
  placeholderUID: {
    type: String,
    required: true,
  },
  placeholderUsername: {
    type: String,
    required: true,
  },
  gameIdCheckerUrl: {
    type: String,
    required: false,
  },
  // Zone ID support fields
  requiresZoneId: {
    type: Boolean,
    default: false,
  },
  placeholderZoneId: {
    type: String,
    required: false,
  },
  productQuantity: [
    {
      quantity: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      costPrice: {
        type: Number,
        default: 0,
        // This field is admin-only and should never be exposed to public APIs
      },
    },
  ],
  quantityInStock: {
    type: Number,
    default: null, // null means unlimited stock
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field for basePrice (minimum price from productQuantity)
productSchema.virtual("basePrice").get(function () {
  if (!this.productQuantity || this.productQuantity.length === 0) return 0;
  return Math.min(...this.productQuantity.map((item) => item.price));
});

// Virtual field for maxPrice (maximum price from productQuantity)
productSchema.virtual("maxPrice").get(function () {
  if (!this.productQuantity || this.productQuantity.length === 0) return 0;
  return Math.max(...this.productQuantity.map((item) => item.price));
});

// Ensure virtual fields are included when converting to JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Pre-save middleware to automatically set isLoginRequired to false for specific categories
productSchema.pre("save", function (next) {
  if (["subscription", "giftcard", "voucher"].includes(this.category)) {
    this.isLoginRequired = false;
  }
  next();
});

// Pre-update middleware for findOneAndUpdate operations
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (
    update.category &&
    ["subscription", "giftcard", "voucher"].includes(update.category)
  ) {
    update.isLoginRequired = false;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
