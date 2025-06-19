const express = require("express");
const router = express.Router();
const orderController = require("./order.controller");
const { verifyAdmin } = require("../middleware/adminAuth");

// POST /api/orders - create order
router.post("/", orderController.createOrder);

// GET /api/orders - get all orders (admin)
router.get("/", orderController.getAllOrders);

// GET /api/orders/user/:userId - get orders for a user
router.get("/user/:userId", orderController.getUserOrders);

// PATCH /api/orders/:id/status - update order status
router.patch("/:id/status", orderController.updateOrderStatus);

// DELETE /api/orders/:id - delete order
router.delete("/:id", orderController.deleteOrder);

// Debug endpoint for checking order data
router.get("/debug/orders", verifyAdmin, orderController.debugOrders);

module.exports = router;
