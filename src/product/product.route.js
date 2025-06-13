const express = require("express");
const Product = require("./product.model");
const {
  postAProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("./product.controller");
const router = express.Router();

// Post A Products
router.post("/create-product", postAProduct);

router.get("/", getAllProducts);

router.get("/:id", getSingleProduct);

router.put("/edit/:id", updateProduct);

router.delete("/delete/:id", deleteProduct);

module.exports = router;
