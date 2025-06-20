const express = require("express");
const {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  initializeDefaultTemplates,
  getTemplateVariables,
  getTemplateVariablesSummary,
  toggleTemplateStatus,
  getTemplateStatusSummary,
} = require("./emailTemplate.controller");
const emailService = require("./emailService");
const User = require("../user/user.model");
const { verifyAdmin } = require("../middleware/adminAuth");
const emailDiagnosticsRouter = require("./email-diagnostics.route");

const router = express.Router();

// Use the diagnostics routes
router.use("/diagnostics", emailDiagnosticsRouter);

// Send custom email to users endpoint
router.post("/send-custom", verifyAdmin, async (req, res) => {
  try {
    const { recipients, subject, message, sendToAll } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required",
        success: false,
      });
    }

    let targetUsers = [];

    if (sendToAll) {
      // Get all active users
      const users = await User.find({ status: "active" }).select("email name");
      targetUsers = users;
    } else if (recipients && recipients.length > 0) {
      // Get specific users by their IDs
      const users = await User.find({
        _id: { $in: recipients },
        status: "active",
      }).select("email name");
      targetUsers = users;
    } else {
      return res.status(400).json({
        message: "No recipients specified",
        success: false,
      });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        message: "No valid recipients found",
        success: false,
      });
    } // Send emails to all target users
    const emailPromises = targetUsers.map((user) =>
      emailService.sendCustomEmail(user.email, {
        customerName: user.name || "Valued Customer",
        subject: subject,
        message: message,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value
    ).length;

    res.status(200).json({
      message: `Custom email sent to ${successCount}/${targetUsers.length} users`,
      success: true,
      totalSent: successCount,
      totalAttempted: targetUsers.length,
    });
  } catch (error) {
    console.error("Error sending custom email:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Test HTML email endpoint
router.post("/test-html", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Email address is required" });
    }
    const result = await emailService.sendTestHtmlEmail(to);

    if (result) {
      res.status(200).json({
        message: "HTML test email sent successfully",
        success: true,
      });
    } else {
      res.status(500).json({
        message: "Failed to send HTML test email",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in test-html endpoint:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Test order emails endpoint
router.post("/test-order-emails", async (req, res) => {
  try {
    const { to, type = "all" } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const results = {};
    const mockOrderData = {
      userName: "Test User",
      orderId: "TEST123",
      productName: "PUBG Mobile UC 1800",
      quantity: 1,
      totalAmount: 2500,
      originalAmount: 2800,
      discountAmount: 300,
      couponCode: "SAVE300",
      currency: "NPR",
      paymentMethod: "eSewa",
      playerID: "123456789",
      username: "TestPlayer",
      billingName: "Test User",
      billingEmail: to,
      billingPhone: "+977-9800000000",
      createdAt: new Date(),
      customerName: "Test User",
      customerEmail: to,
    };

    const mockCouponData = {
      name: "Test User",
      email: to,
    };

    const mockCoupon = {
      code: "EXCLUSIVE50",
      discountType: "percentage",
      discountValue: 50,
      maxDiscount: 1000,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      usageLimit: 1,
      usagePerUser: 1,
    };

    if (type === "all" || type === "confirmation") {
      console.log("🧪 Testing order confirmation email...");
      results.confirmation = await emailService.sendOrderCompletionEmail(
        to,
        mockOrderData
      );
    }

    if (type === "all" || type === "delivered") {
      console.log("🧪 Testing order delivered email...");
      results.delivered = await emailService.sendOrderDeliveredEmail(
        to,
        mockOrderData
      );
    }

    if (type === "all" || type === "cancelled") {
      console.log("🧪 Testing order cancelled email...");
      results.cancelled = await emailService.sendOrderCancelledEmail(
        to,
        mockOrderData
      );
    }

    if (type === "all" || type === "admin-new") {
      console.log("🧪 Testing admin new order email...");
      results.adminNew = await emailService.sendAdminNewOrderNotification(
        mockOrderData
      );
    }

    if (type === "all" || type === "admin-status") {
      console.log("🧪 Testing admin status update email...");
      results.adminStatus = await emailService.sendAdminOrderStatusUpdate(
        mockOrderData,
        "pending",
        "delivered"
      );
    }

    if (type === "all" || type === "coupon") {
      console.log("🧪 Testing exclusive coupon email...");
      results.coupon = await emailService.sendExclusiveCouponEmail(
        to,
        mockCouponData,
        mockCoupon
      );
    }

    const successCount = Object.values(results).filter(
      (result) => result
    ).length;
    const totalCount = Object.keys(results).length;

    res.status(200).json({
      message: `Test emails completed: ${successCount}/${totalCount} sent successfully`,
      success: true,
      results: results,
      testType: type,
    });
  } catch (error) {
    console.error("Error in test-order-emails endpoint:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Initialize default templates (should be called once)
router.post("/templates/init", initializeDefaultTemplates);

// Get all email templates
router.get("/templates", getAllTemplates);

// Get single email template
router.get("/templates/:id", getTemplate);

// Create new email template
router.post("/templates", createTemplate);

// Update email template
router.put("/templates/:id", updateTemplate);

// Delete email template
router.delete("/templates/:id", deleteTemplate);

// Toggle template status (enable/disable)
router.patch("/templates/:id/toggle", verifyAdmin, toggleTemplateStatus);

// Get template status summary
router.get("/templates/status/summary", verifyAdmin, getTemplateStatusSummary);

// Get template variables with documentation
router.get("/templates/:type/variables", getTemplateVariables);

// Get all template variables summary
router.get("/variables/summary", getTemplateVariablesSummary);

// Simple test route to verify email template
router.get("/test-template/:email", async (req, res) => {
  try {
    const { email } = req.params;

    console.log(`🧪 Testing email template for: ${email}`);
    const result = await emailService.sendCustomEmail(email, {
      customerName: "Test User",
      subject: "🎮 Template Test - Beautiful Email Design",
      message:
        "This is a test message to verify that the beautiful HTML template is working correctly.\n\nThe email should have:\n- Gradient header with gaming theme\n- Styled message box with emoji\n- Feature grid showing gaming services\n- Professional footer with links\n- Mobile-responsive design\n\nIf you see this message in a beautifully styled email, the template is working perfectly!",
    });

    if (result) {
      res.status(200).json({
        message: `Test email sent successfully to ${email}`,
        success: true,
        note: "Check your email for the beautiful template!",
      });
    } else {
      res.status(500).json({
        message: "Failed to send test email",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in test template route:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Debug test route to send a very obvious HTML email
router.get("/debug-html/:email", async (req, res) => {
  try {
    const { email } = req.params;

    console.log(`🔍 Sending debug HTML email to: ${email}`);

    // Create a very obvious HTML email that's easy to identify
    const debugHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HTML Debug Test</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #ff0000; color: white; padding: 40px; text-align: center;">
  <div style="background-color: #0000ff; padding: 30px; border-radius: 15px; color: yellow;">
    <h1 style="font-size: 48px; margin: 0;">🎮 HTML IS WORKING! 🎮</h1>
    <p style="font-size: 24px; margin: 20px 0;">If you can see this colorful email, HTML is working perfectly!</p>
    <div style="background-color: #00ff00; color: black; padding: 20px; margin: 20px; border-radius: 10px;">
      <h2>✅ This email proves HTML support works</h2>
      <p>Red background, blue box, green section, yellow text!</p>
    </div>
    <p style="font-size: 18px;">Email sent at: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

    const emailSettings = await emailService.loadEmailSettings();

    const mailOptions = {
      from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
      to: email,
      subject: "🔍 HTML DEBUG TEST - Very Obvious Colors",
      html: debugHtmlContent,
      text: "PLAIN TEXT VERSION: If you see this text instead of colorful HTML, your email client doesn't support HTML or has it disabled.",
      headers: {
        "X-Priority": "3",
        "Content-Type": "text/html; charset=utf-8",
      },
    };

    const info = await emailService.transporter.sendMail(mailOptions);
    console.log(`🔍 Debug HTML email sent: ${info.messageId}`);

    res.status(200).json({
      message: `Debug HTML email sent to ${email}`,
      success: true,
      note: "If you don't see bright colors and large text, your email client doesn't support HTML properly",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error in debug HTML route:", error);
    res.status(500).json({
      message: "Failed to send debug email",
      error: error.message,
      success: false,
    });
  }
});

// Ultra simple email test route to bypass template issues
router.get("/simple-test/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const emailSettings = await emailService.loadEmailSettings();

    // Ultra simple HTML that should work in any email client
    const simpleHtml = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1 style="color: blue;">XenoNepal Test Email</h1>
          <p>Hello! This is a test email.</p>
          <p style="background: yellow; padding: 10px;">If you see this with colors and formatting, HTML emails work!</p>
          <p>Best regards,<br>XenoNepal Team</p>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
      to: email,
      subject: "Simple HTML Test - XenoNepal",
      html: simpleHtml,
      text: "Simple text version: If you see this, your email client doesn't support HTML.",
    };

    const info = await emailService.transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Simple test email sent to ${email}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Simple email test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send simple test email",
      error: error.message,
    });
  }
});

// Direct email sending route bypassing corrupted emailService
router.post("/send-custom-direct", verifyAdmin, async (req, res) => {
  try {
    const { recipients, subject, message, sendToAll } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required",
        success: false,
      });
    }

    let targetUsers = [];

    if (sendToAll) {
      const users = await User.find({ status: "active" }).select("email name");
      targetUsers = users;
    } else if (recipients && recipients.length > 0) {
      const users = await User.find({
        _id: { $in: recipients },
        status: "active",
      }).select("email name");
      targetUsers = users;
    } else {
      return res.status(400).json({
        message: "No recipients specified",
        success: false,
      });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        message: "No valid recipients found",
        success: false,
      });
    }

    // Direct email sending using nodemailer
    const nodemailer = require("nodemailer");
    const Setting = require("../settings/setting.model");

    // Load email settings
    const settings = await Setting.findOne();
    const emailSettings = settings?.emailSettings || {
      emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
      emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
      emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
      supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
      enableEmailNotifications: true,
    };

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailSettings.emailUser,
        pass: emailSettings.emailPassword,
      },
    });

    // Send emails directly
    const emailPromises = targetUsers.map(async (user) => {
      const simpleHtml =
        "<html><body style='font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto;'>" +
        "<div style='background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;'>" +
        "<h1 style='margin: 0;'>🎮 XenoNepal</h1>" +
        "<h2 style='margin: 10px 0 0 0;'>" +
        subject +
        "</h2></div>" +
        "<div style='padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 20px;'>" +
        "<h3 style='margin: 0 0 15px 0;'>Hello " +
        (user.name || "Valued Customer") +
        ",</h3>" +
        "<p style='line-height: 1.6;'>" +
        message.replace(/\n/g, "<br>") +
        "</p></div>" +
        "<div style='text-align: center; margin: 20px 0;'>" +
        "<a href='https://xenonepal.com' style='background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;'>🛒 Visit XenoNepal</a></div>" +
        "<div style='text-align: center; padding: 20px; color: #666; font-size: 14px;'>" +
        "<p>🎯 Gaming Top-ups | 📺 Subscriptions | 🎁 Gift Cards</p>" +
        "<p>© 2025 XenoNepal. All rights reserved.</p>" +
        "<p>Support: " +
        emailSettings.supportEmail +
        "</p></div></body></html>";

      const textVersion =
        "XenoNepal - " +
        subject +
        "\\n\\n" +
        "Hello " +
        (user.name || "Valued Customer") +
        ",\\n\\n" +
        message +
        "\\n\\n" +
        "Visit us: https://xenonepal.com\\n" +
        "Support: " +
        emailSettings.supportEmail +
        "\\n\\n" +
        "© 2025 XenoNepal. All rights reserved.";

      const mailOptions = {
        from:
          emailSettings.emailFromName + " <" + emailSettings.emailUser + ">",
        to: user.email,
        subject: subject,
        html: simpleHtml,
        text: textVersion,
      };

      console.log("📧 Sending direct email to " + user.email);
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Direct email sent: " + info.messageId);
      return true;
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value
    ).length;

    res.status(200).json({
      message:
        "Custom email sent to " +
        successCount +
        "/" +
        targetUsers.length +
        " users",
      success: true,
      totalSent: successCount,
      totalAttempted: targetUsers.length,
    });
  } catch (error) {
    console.error("Error sending direct custom email:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Direct test email route
router.get("/test-direct/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Direct email sending using nodemailer
    const nodemailer = require("nodemailer");
    const Setting = require("../settings/setting.model");

    // Load email settings
    const settings = await Setting.findOne();
    const emailSettings = settings?.emailSettings || {
      emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
      emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
      emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
      supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
    };

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: emailSettings.emailUser,
        pass: emailSettings.emailPassword,
      },
    });

    const simpleHtml =
      "<html><body style='font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto;'>" +
      "<div style='background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;'>" +
      "<h1 style='margin: 0;'>🎮 XenoNepal</h1>" +
      "<h2 style='margin: 10px 0 0 0;'>HTML Template Test</h2></div>" +
      "<div style='padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 20px;'>" +
      "<h3 style='margin: 0 0 15px 0;'>Hello Test User,</h3>" +
      "<p style='line-height: 1.6;'>This is a direct test of our HTML email template.<br><br>" +
      "If you can see this with proper styling, colors, and formatting, then HTML emails are working correctly!</p></div>" +
      "<div style='text-align: center; margin: 20px 0;'>" +
      "<a href='https://xenonepal.com' style='background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;'>🛒 Visit XenoNepal</a></div>" +
      "<div style='text-align: center; padding: 20px; color: #666; font-size: 14px;'>" +
      "<p>🎯 Gaming Top-ups | 📺 Subscriptions | 🎁 Gift Cards</p>" +
      "<p>© 2025 XenoNepal. All rights reserved.</p>" +
      "<p>Support: " +
      emailSettings.supportEmail +
      "</p></div></body></html>";

    const textVersion =
      "XenoNepal - HTML Template Test\\n\\n" +
      "Hello Test User,\\n\\n" +
      "This is a direct test of our HTML email template. If you see this plain text instead of styled content, your email client doesn't support HTML.\\n\\n" +
      "Visit us: https://xenonepal.com\\n" +
      "Support: " +
      emailSettings.supportEmail +
      "\\n\\n" +
      "© 2025 XenoNepal. All rights reserved.";

    const mailOptions = {
      from: emailSettings.emailFromName + " <" + emailSettings.emailUser + ">",
      to: email,
      subject: "🎮 Direct HTML Test - XenoNepal",
      html: simpleHtml,
      text: textVersion,
    };

    console.log("📧 Sending direct test email to " + email);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Direct test email sent: " + info.messageId);

    res.json({
      success: true,
      message: "Direct test email sent to " + email,
      messageId: info.messageId,
      note: "Check your email - if you see styled content instead of raw code, HTML works!",
    });
  } catch (error) {
    console.error("Direct email test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send direct test email",
      error: error.message,
    });
  }
});

// Direct email test endpoint (for troubleshooting)
router.post("/direct-test", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email address is required",
        success: false,
      });
    }

    console.log(`📧 Direct test email requested to: ${email}`);

    // Force transporter reinitialization
    await emailService.initializeTransporter();

    const result = await emailService.sendCustomEmail(email, {
      customerName: "Test User",
      subject: subject || "Direct Test Email - XenoNepal",
      message:
        message ||
        "This is a direct test email to verify email delivery is working correctly.\n\nIf you received this email, the system is functioning properly.",
    });

    if (result) {
      res.status(200).json({
        message: "Direct test email sent successfully",
        success: true,
        details: "Please check your inbox and spam/junk folders",
      });
    } else {
      res.status(500).json({
        message: "Failed to send direct test email",
        success: false,
        details: "Check server logs for detailed error information",
      });
    }
  } catch (error) {
    console.error("Error sending direct test email:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
      stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
    });
  }
});

module.exports = router;
