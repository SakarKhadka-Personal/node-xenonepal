const Coupon = require("./coupon.model");
const Order = require("../order/order.model");

// Create a new coupon (Admin only)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      validFor,
      users,
      products,
      usageLimit,
      usagePerUser,
      expiresAt,
      isActive,
    } = req.body;

    // Validate required fields
    if (
      !code ||
      !discountType ||
      !discountValue ||
      !usageLimit ||
      !usagePerUser ||
      !expiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Create the new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscount: discountType === "percentage" ? maxDiscount : 0,
      validFor,
      users: validFor === "user" ? users : [],
      products: validFor === "product" ? products : [],
      usageLimit,
      usagePerUser,
      expiresAt: new Date(expiresAt),
      isActive: isActive !== undefined ? isActive : true,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

// Get all coupons (Admin only)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

// Get a single coupon by ID (Admin only)
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};

// Update a coupon (Admin only)
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Make sure code is uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();

      // Check if new code already exists (if different from current)
      const existingCoupon = await Coupon.findOne({ code: updateData.code });
      if (existingCoupon && existingCoupon._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Handle date conversion
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    // Filter out empty arrays
    if (
      updateData.validFor === "user" &&
      (!updateData.users || updateData.users.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "User-specific coupons must have at least one user",
      });
    }

    if (
      updateData.validFor === "product" &&
      (!updateData.products || updateData.products.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Product-specific coupons must have at least one product",
      });
    }

    // Only include relevant arrays based on validFor
    if (updateData.validFor === "all") {
      updateData.users = [];
      updateData.products = [];
    } else if (updateData.validFor === "user") {
      updateData.products = [];
    } else if (updateData.validFor === "product") {
      updateData.users = [];
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

// Delete a coupon (Admin only)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

// Get coupon usage statistics (Admin only)
const getCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Get detailed usage information with order details
    const usageDetails = await Promise.all(
      coupon.usedBy.map(async (usage) => {
        try {
          const order = await Order.findById(usage.orderId);
          return {
            ...usage.toObject(),
            order: order
              ? {
                  _id: order._id,
                  total: order.order.total,
                  status: order.status,
                  paymentMethod: order.paymentMethod,
                  createdAt: order.createdAt,
                }
              : null,
          };
        } catch (err) {
          return usage.toObject();
        }
      })
    );

    res.status(200).json({
      success: true,
      couponCode: coupon.code,
      totalUsed: coupon.totalUsed,
      usageLimit: coupon.usageLimit,
      remainingUses: coupon.usageLimit - coupon.totalUsed,
      usageDetails: usageDetails,
    });
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon usage",
      error: error.message,
    });
  }
};

// Validate and apply coupon to cart (User)
const validateAndApplyCoupon = async (req, res) => {
  try {
    const { code, userId, cartTotal, products } = req.body;

    if (!code || !userId || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: "Please provide coupon code, user ID and cart total",
      });
    }

    // Find the coupon (case insensitive) and get fresh data
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }); // Check if coupon exists
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message:
          "❌ Invalid coupon code. Please check your coupon code and try again.",
        errorType: "INVALID_CODE",
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "🚫 This coupon has been deactivated by the store. Please contact support for assistance.",
        errorType: "COUPON_INACTIVE",
      });
    }

    // Check if coupon is expired
    if (coupon.isExpired) {
      const expiryDate = new Date(coupon.expiresAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      return res.status(400).json({
        success: false,
        message: `⏰ This coupon expired on ${expiryDate}. Please check our website for current offers!`,
        errorType: "COUPON_EXPIRED",
        expiryDate: coupon.expiresAt,
      });
    }

    // Check if coupon usage limit has been reached (fresh check)
    if (coupon.usedBy.length >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `😔 This coupon has reached its maximum usage limit (${coupon.usageLimit} uses). It has been fully redeemed by other customers.`,
        errorType: "USAGE_LIMIT_REACHED",
        usageInfo: {
          currentUsage: coupon.usedBy.length,
          usageLimit: coupon.usageLimit,
        },
      });
    }

    // Check user-specific validation
    const userUsageCount = coupon.usedBy.filter(
      (usage) => usage.userId === userId
    ).length; // Check if user can use this coupon (user-specific coupons)
    if (coupon.validFor === "user" && !coupon.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "🎯 This is an exclusive coupon that's not available for your account. Check your email for personalized offers!",
        errorType: "USER_NOT_ELIGIBLE",
      });
    }

    // Check if user has reached their personal usage limit
    if (userUsageCount >= coupon.usagePerUser) {
      if (coupon.usagePerUser === 1) {
        return res.status(400).json({
          success: false,
          message: `✋ You have already used this coupon once. This is a one-time use coupon per customer.`,
          errorType: "USER_LIMIT_REACHED",
          userUsageInfo: {
            timesUsed: userUsageCount,
            allowedUses: coupon.usagePerUser,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `✋ You have already used this coupon ${userUsageCount} time(s). Maximum allowed uses per customer: ${coupon.usagePerUser}`,
          errorType: "USER_LIMIT_REACHED",
          userUsageInfo: {
            timesUsed: userUsageCount,
            allowedUses: coupon.usagePerUser,
          },
        });
      }
    } // For product-specific coupons, check if applicable to any product in cart
    if (coupon.validFor === "product" && products && products.length > 0) {
      const hasValidProduct = products.some((product) =>
        coupon.canBeAppliedTo(product.productId)
      );

      if (!hasValidProduct) {
        return res.status(400).json({
          success: false,
          message:
            "🛍️ This coupon is only valid for specific products that are not currently in your cart. Please check the coupon terms for eligible items.",
          errorType: "PRODUCT_NOT_ELIGIBLE",
        });
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal); // Return discount information
    res.status(200).json({
      success: true,
      message: `🎉 Coupon "${coupon.code}" applied successfully! You saved ${
        coupon.discountType === "percentage"
          ? coupon.discountValue + "%"
          : "NPR " + coupon.discountValue
      }`,
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalTotal: cartTotal - discountAmount,
      usageInfo: {
        currentUsage: coupon.usedBy.length,
        usageLimit: coupon.usageLimit,
        userUsage: userUsageCount,
        userLimit: coupon.usagePerUser,
        remainingUses: coupon.usageLimit - coupon.usedBy.length,
        userRemainingUses: coupon.usagePerUser - userUsageCount,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

// Apply coupon to an order (record usage)
const recordCouponUsage = async (req, res) => {
  try {
    const { code, userId, orderId, discountAmount } = req.body;

    if (!code || !userId || !orderId || discountAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Find the coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "❌ Coupon not found during usage recording",
        errorType: "COUPON_NOT_FOUND",
      });
    }

    // Re-validate usage limits before recording (race condition protection)
    const userUsageCount = coupon.usedBy.filter(
      (usage) => usage.userId === userId
    ).length;

    if (userUsageCount >= coupon.usagePerUser) {
      return res.status(400).json({
        success: false,
        message: `✋ Recording failed: User has already used this coupon ${userUsageCount} time(s). Maximum allowed: ${coupon.usagePerUser}`,
        errorType: "USER_LIMIT_EXCEEDED",
      });
    }

    if (coupon.usedBy.length >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `😔 Recording failed: Coupon has reached its maximum usage limit (${coupon.usageLimit} uses)`,
        errorType: "TOTAL_LIMIT_EXCEEDED",
      });
    }

    // Check if this order has already used this coupon (prevent duplicate recording)
    const existingUsage = coupon.usedBy.find(
      (usage) => usage.orderId.toString() === orderId.toString()
    );
    if (existingUsage) {
      return res.status(400).json({
        success: false,
        message: "⚠️ This coupon has already been applied to this order",
        errorType: "DUPLICATE_USAGE",
      });
    }

    // Add usage record
    coupon.usedBy.push({
      userId,
      orderId,
      date: new Date(),
      discountAmount,
    });

    await coupon.save();
    res.status(200).json({
      success: true,
      message: `✅ Coupon usage recorded successfully! "${coupon.code}" has been used ${coupon.usedBy.length}/${coupon.usageLimit} times.`,
      totalUsage: coupon.usedBy.length,
      usageLimit: coupon.usageLimit,
      userUsage: userUsageCount + 1,
      userLimit: coupon.usagePerUser,
      remainingUses: coupon.usageLimit - coupon.usedBy.length,
    });
  } catch (error) {
    console.error("Error recording coupon usage:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record coupon usage",
      error: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
  validateAndApplyCoupon,
  recordCouponUsage,
};
