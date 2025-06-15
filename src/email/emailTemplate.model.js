const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "order_completion",
        "order_delivered",
        "user_registration",
        "welcome",
        "test_email",
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
  },
  {
    timestamps: true,
  }
);

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
module.exports = EmailTemplate;
