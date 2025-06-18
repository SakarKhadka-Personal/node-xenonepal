const express = require("express");
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
  validateAndApplyCoupon,
  recordCouponUsage,
} = require("./coupon.controller");
const router = express.Router();

// Admin routes
router.post("/create", createCoupon);
router.get("/", getAllCoupons);
router.get("/:id", getCouponById);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);
router.get("/:id/usage", getCouponUsage);

// User routes
router.post("/validate", validateAndApplyCoupon);
router.post("/record-usage", recordCouponUsage);

module.exports = router;
