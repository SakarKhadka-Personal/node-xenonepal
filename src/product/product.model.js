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

  basePrice: {
    type: Number,
    required: true,
  },
  maxPrice: {
    type: Number,
    required: true,
  },
  currencyName: {
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
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
