const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
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
      image: {
        type: String,
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
