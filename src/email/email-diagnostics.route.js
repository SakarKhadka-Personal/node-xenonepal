// This file provides a diagnostic endpoint to test email templates
const express = require("express");
const router = express.Router();
const EmailTemplate = require("./emailTemplate.model");
const emailService = require("./emailService");
const { verifyAdmin } = require("../middleware/adminAuth");

// Get template preview with dummy data
router.get("/template-preview/:type", verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;

    // Find the template in the database
    const template = await EmailTemplate.findOne({ type });

    if (!template) {
      return res.status(404).json({ message: "Email template not found" });
    } // Create sample data based on template type
    let sampleData = {
      customerName: "Sample Customer",
      subject: template.subject || "Sample Subject",
      message: "This is a sample message content.",
      appName: "XenoNepal",
      websiteUrl: "https://xenonepal.com",
      supportEmail: "support@xenonepal.com",
      currentYear: new Date().getFullYear(),
      amount: 1500,
      billingName: "John Customer",
      billingPhone: "9763397144",
      billingEmail: "customer@example.com",
      deliveryDate: new Date().toLocaleDateString(),
    };

    // Add additional sample data based on template type
    switch (type) {
      case "order_completion":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          amount: 1500,
          currency: "NPR",
          paymentMethod: "Khalti",
          orderDate: new Date().toLocaleDateString(),
          discountInfo: "\nDiscount Applied: SAMPLE10 (-NPR 150)",
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Customer",
          billingEmail: "customer@example.com",
          billingPhone: "9763397144",
        };
        break;
      case "order_delivered":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          amount: 1500,
          currency: "NPR",
          paymentMethod: "eSewa",
          deliveryDate: new Date().toLocaleDateString(),
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Customer",
          billingEmail: "customer@example.com",
          billingPhone: "9763397144",
        };
        break;
      case "admin_new_order":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          currency: "NPR",
          paymentMethod: "Khalti",
          orderDate: new Date().toLocaleDateString(),
          discountInfo: "\nDiscount Applied: SAMPLE10 (-NPR 150)",
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Doe",
          billingEmail: "john@example.com",
          billingPhone: "9876543210",
        };
        break;
      case "exclusive_coupon":
        sampleData = {
          ...sampleData,
          couponCode: "SAMPLE25",
          discountText: "25% OFF (Max: NPR 500)",
          usageLimit: 1,
          expiryDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          issuedDate: new Date().toLocaleDateString(),
          userName: "John Doe",
        };
        break;
      case "welcome":
        sampleData = {
          ...sampleData,
          userName: "John Doe",
          userEmail: "john@example.com",
        };
        break;
      default:
        // Default sample data already set
        break;
    }

    // Process template variables
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // Replace template variables with sample data
    Object.keys(sampleData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      htmlContent = htmlContent.replace(regex, sampleData[key] || "");
      textContent = textContent.replace(regex, sampleData[key] || "");
    });

    // Return preview data
    res.status(200).json({
      templateType: type,
      subject: template.subject,
      htmlContent,
      textContent,
      sampleData,
    });
  } catch (error) {
    console.error("Error generating template preview:", error);
    res.status(500).json({
      message: "Failed to generate template preview",
      error: error.message,
    });
  }
});

// Send a test email with the template
router.post("/send-test-email/:type", verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    // Create sample data based on template type (same as above)
    let sampleData = {
      customerName: "Sample Customer",
      subject: `Test Email - ${type}`,
      message: "This is a test email to verify the template.",
      appName: "XenoNepal",
      websiteUrl: "https://xenonepal.com",
      supportEmail: "support@xenonepal.com",
      currentYear: new Date().getFullYear(),
      amount: 1500,
      billingName: "John Customer",
      billingPhone: "9763397144",
      billingEmail: "customer@example.com",
      deliveryDate: new Date().toLocaleDateString(),
    };

    // Add additional sample data based on template type (same as above)
    switch (type) {
      case "order_completion":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          amount: 1500,
          currency: "NPR",
          paymentMethod: "Khalti",
          orderDate: new Date().toLocaleDateString(),
          discountInfo: "\nDiscount Applied: SAMPLE10 (-NPR 150)",
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Customer",
          billingEmail: "customer@example.com",
          billingPhone: "9763397144",
        };
        break;
      case "order_delivered":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          amount: 1500,
          currency: "NPR",
          paymentMethod: "eSewa",
          deliveryDate: new Date().toLocaleDateString(),
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Customer",
          billingEmail: "customer@example.com",
          billingPhone: "9763397144",
        };
        break;
      case "admin_new_order":
        sampleData = {
          ...sampleData,
          orderId: "XN12345",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          productName: "Sample Product",
          quantity: 2,
          totalAmount: 1500,
          currency: "NPR",
          paymentMethod: "Khalti",
          orderDate: new Date().toLocaleDateString(),
          discountInfo: "\nDiscount Applied: SAMPLE10 (-NPR 150)",
          playerID: "12345678",
          username: "gamer123",
          billingName: "John Doe",
          billingEmail: "john@example.com",
          billingPhone: "9876543210",
        };
        break;
      case "exclusive_coupon":
        sampleData = {
          ...sampleData,
          couponCode: "SAMPLE25",
          discountText: "25% OFF (Max: NPR 500)",
          usageLimit: 1,
          expiryDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          issuedDate: new Date().toLocaleDateString(),
          userName: "John Doe",
        };
        break;
      case "welcome":
        sampleData = {
          ...sampleData,
          userName: "John Doe",
          userEmail: "john@example.com",
        };
        break;
      default:
        // Default sample data already set
        break;
    }

    // Send the test email
    const result = await emailService.sendCustomEmail(email, sampleData, type);

    if (result) {
      res
        .status(200)
        .json({ message: `Test email sent to ${email} successfully` });
    } else {
      res.status(500).json({ message: "Failed to send test email" });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    res
      .status(500)
      .json({ message: "Failed to send test email", error: error.message });
  }
});

// Create a default template for the specified type if it doesn't exist
router.post("/create-default-template/:type", verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;

    // Check if template exists
    const existingTemplate = await EmailTemplate.findOne({ type });
    if (existingTemplate) {
      return res
        .status(400)
        .json({ message: `Template for ${type} already exists` });
    }

    // Define default templates based on type
    let template = {
      type,
      subject: `Default ${type} Subject`,
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background-color: #667eea; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🎮 XenoNepal</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">{{subject}}</h2>
      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Gaming Excellence Delivered</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Hello {{customerName}},</h3>
      
      <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-line;">{{message}}</p>
      </div>
      
      <!-- Call to Action -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://xenonepal.com" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">🛒 Visit XenoNepal</a>
      </div>
      
      <!-- Services -->
      <div style="text-align: center; margin: 20px 0; color: #666; font-size: 14px;">
        <p><strong>🎯 Gaming Top-ups | 📺 Subscriptions | 🎁 Gift Cards | ⚡ Instant Delivery</strong></p>
      </div>
      
      <p style="text-align: center; color: #666; font-style: italic; margin-top: 20px;">Thank you for being a valued member of our gaming community!</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px;">XenoNepal</h3>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #bdc3c7;">Your trusted partner for gaming needs across Nepal</p>
      
      <div style="margin: 15px 0;">
        <a href="https://xenonepal.com" style="color: #bdc3c7; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a> |
        <a href="https://xenonepal.com/topup" style="color: #bdc3c7; text-decoration: none; font-size: 12px; margin: 0 8px;">Top-ups</a> |
        <a href="https://xenonepal.com/subscription" style="color: #bdc3c7; text-decoration: none; font-size: 12px; margin: 0 8px;">Subscriptions</a> |
        <a href="https://xenonepal.com/contact" style="color: #bdc3c7; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
      </div>
      
      <p style="margin: 15px 0 0 0; font-size: 11px; color: #95a5a6;">
        © {{currentYear}} XenoNepal. All rights reserved.<br>
        Need help? Contact us at {{supportEmail}}
      </p>
    </div>
    
  </div>
</body>
</html>`,
      textContent: `XenoNepal - {{subject}}

Hello {{customerName}},

{{message}}

🎯 Gaming Top-ups | 📺 Subscriptions | 🎁 Gift Cards | ⚡ Instant Delivery

Visit us: https://xenonepal.com
Support: {{supportEmail}}

Thank you for being a valued member of our gaming community!

© {{currentYear}} XenoNepal. All rights reserved.`,
      isActive: true,
      availableVariables: [
        "customerName",
        "subject",
        "message",
        "supportEmail",
        "currentYear",
      ],
    };

    // Customize template based on type
    switch (type) {
      case "order_completion":
        template.subject = "🎮 Order Confirmed #{{orderId}} - XenoNepal";
        template.availableVariables = [
          ...template.availableVariables,
          "orderId",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "paymentMethod",
          "orderDate",
          "discountInfo",
          "playerID",
          "username",
        ];
        break;
      case "order_delivered":
        template.subject = "✅ Order Delivered #{{orderId}} - XenoNepal";
        template.availableVariables = [
          ...template.availableVariables,
          "orderId",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "deliveryDate",
          "playerID",
          "username",
        ];
        break;
      case "admin_new_order":
        template.subject = "🚨 New Order Alert #{{orderId}} - Action Required";
        template.availableVariables = [
          ...template.availableVariables,
          "orderId",
          "customerName",
          "customerEmail",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "paymentMethod",
          "orderDate",
          "discountInfo",
          "playerID",
          "username",
          "billingName",
          "billingEmail",
          "billingPhone",
        ];
        break;
      case "exclusive_coupon":
        template.subject =
          "🎁 Exclusive Coupon Just for You: {{couponCode}} - XenoNepal";
        template.availableVariables = [
          ...template.availableVariables,
          "couponCode",
          "discountText",
          "usageLimit",
          "expiryDate",
          "issuedDate",
          "userName",
        ];
        break;
      case "welcome":
        template.subject = "👋 Welcome to XenoNepal!";
        template.availableVariables = [
          ...template.availableVariables,
          "userName",
          "userEmail",
        ];
        break;
      default:
        // Default template already set
        break;
    }

    // Save the template
    const newTemplate = new EmailTemplate(template);
    await newTemplate.save();

    res.status(201).json({
      message: `Default template for ${type} created successfully`,
      template: newTemplate,
    });
  } catch (error) {
    console.error("Error creating default template:", error);
    res.status(500).json({
      message: "Failed to create default template",
      error: error.message,
    });
  }
});

module.exports = router;
