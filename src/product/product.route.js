const express = require("express");
const Product = require("./product.model");
const {
  postAProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  validateGameId,
} = require("./product.controller");
const router = express.Router();

// Post A Products
router.post("/create-product", postAProduct);

router.get("/", getAllProducts);

router.get("/:id", getSingleProduct);

router.put("/edit/:id", updateProduct);

router.delete("/delete/:id", deleteProduct);

// Game ID validation route
router.post("/validate-game-id", validateGameId);

module.exports = router;
