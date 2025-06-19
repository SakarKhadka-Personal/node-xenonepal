const express = require("express");
const Product = require("./product.model");
const {
  postAProduct,
  getAllProducts,
  getSingleProduct,
  getAllProductsAdmin,
  getSingleProductAdmin,
  updateProduct,
  deleteProduct,
  validateGameId,
} = require("./product.controller");
const { verifyAdmin } = require("../middleware/adminAuth");
const router = express.Router();

// Public routes (without cost data)
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);

// Game ID validation route
router.post("/validate-game-id", validateGameId);

// Admin-only routes (with cost data)
router.get("/admin/all", verifyAdmin, getAllProductsAdmin);
router.get("/admin/:id", verifyAdmin, getSingleProductAdmin);
router.post("/create-product", verifyAdmin, postAProduct);
router.put("/edit/:id", verifyAdmin, updateProduct);
router.delete("/delete/:id", verifyAdmin, deleteProduct);

module.exports = router;
