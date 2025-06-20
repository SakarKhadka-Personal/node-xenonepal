const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "order_completion", // When order is placed
        "order_delivered", // When order is delivered
        "order_cancelled", // When order is cancelled
        "user_registration", // When user registers
        "welcome", // When user logs in
        "test_email", // For testing
        "admin_new_order", // Admin notification for new orders
        "admin_order_status_update", // Admin notification for order status changes
        "exclusive_coupon", // When user receives a coupon
      ],
      unique: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    textContent: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Available variables for templating
    availableVariables: {
      type: [String],
      default: [],
    },
    // Detailed documentation for variables (for admin interface)
    variableDocumentation: {
      type: {
        description: String,
        categories: mongoose.Schema.Types.Mixed,
        totalVariables: Number,
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
module.exports = EmailTemplate;
