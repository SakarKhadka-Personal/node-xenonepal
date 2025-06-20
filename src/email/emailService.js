const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }
  async initializeTransporter() {
    try {
      // Basic Gmail configuration
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "xenonepal@gmail.com",
          pass: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
        },
      });

      console.log("✅ Email service initialized successfully!");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
    }
  }

  async loadEmailSettings() {
    try {
      const Setting = require("../settings/setting.model");
      const settings = await Setting.findOne();

      if (settings && settings.emailSettings) {
        return settings.emailSettings;
      }

      // Fallback to environment variables
      return {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
        emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
        supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
        enableEmailNotifications: true,
      };
    } catch (error) {
      console.error("Error loading email settings:", error);
      // Return fallback settings
      return {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
        emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
        supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
        enableEmailNotifications: true,
      };
    }
  }

  // Working custom email method with proper HTML template
  async sendCustomEmail(userEmail, emailData) {
    try {
      if (!this.transporter) {
        console.error(
          "❌ Email service not initialized. Attempting to reinitialize..."
        );
        await this.initializeTransporter();

        if (!this.transporter) {
          console.error(
            "❌ Email service reinitialization failed. Cannot send email."
          );
          return false;
        }
      }

      const emailSettings = await this.loadEmailSettings();
      console.log("📧 Using email settings:", {
        from: emailSettings.emailFromName,
        user:
          emailSettings.emailUser?.substring(0, 3) +
          "..." +
          (emailSettings.emailUser?.includes("@")
            ? emailSettings.emailUser?.split("@")[1]
            : ""),
        notificationsEnabled: emailSettings.enableEmailNotifications,
      });

      if (!emailSettings.enableEmailNotifications) {
        console.log("❗ Email notifications are disabled in settings");
        return false;
      }

      // Create a simple, reliable HTML template
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailData.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background-color: #667eea; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🎮 XenoNepal</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">${
        emailData.subject
      }</h2>
      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Gaming Excellence Delivered</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">Hello ${
        emailData.customerName
      },</h3>
      
      <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-line;">${
          emailData.message
        }</p>
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
        © ${new Date().getFullYear()} XenoNepal. All rights reserved.<br>
        Need help? Contact us at ${emailSettings.supportEmail}
      </p>
    </div>
    
  </div>
</body>
</html>`;

      // Plain text version
      const textContent = `XenoNepal - ${emailData.subject}

Hello ${emailData.customerName},

${emailData.message}

🎯 Gaming Top-ups | 📺 Subscriptions | 🎁 Gift Cards | ⚡ Instant Delivery

Visit us: https://xenonepal.com
Support: ${emailSettings.supportEmail}

Thank you for being a valued member of our gaming community!

© ${new Date().getFullYear()} XenoNepal. All rights reserved.`;

      const mailOptions = {
        from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
        to: userEmail,
        subject: emailData.subject,
        html: htmlContent,
        text: textContent,
        headers: {
          "X-Priority": "3",
        },
      };

      console.log(`📧 Sending email to ${userEmail}`);
      console.log(`📝 Subject: ${emailData.subject}`);
      console.log(
        `🔄 SMTP Configuration: ${JSON.stringify({
          service: "gmail",
          from: mailOptions.from,
          to: mailOptions.to,
        })}`
      );

      // Log any transport errors
      if (!this.transporter || !this.transporter.sendMail) {
        console.error("❌ Transporter object is invalid:", this.transporter);
        return false;
      }

      const info = await this.transporter.sendMail(mailOptions);

      // Log detailed success info
      console.log("✅ Email sent successfully with the following details:");
      console.log(`📨 Message ID: ${info.messageId}`);
      console.log(
        `📤 Response: ${JSON.stringify(info.response || "No response")}`
      );
      console.log(`📋 Envelope: ${JSON.stringify(info.envelope || {})}`);
      console.log(`🔗 Accepted: ${info.accepted?.join(", ") || "None"}`);
      console.log(`❌ Rejected: ${info.rejected?.join(", ") || "None"}`);
      console.log(`⚠️ Pending: ${info.pending?.join(", ") || "None"}`);

      return info.accepted && info.accepted.length > 0;
    } catch (error) {
      console.error(`❌ Error sending email to ${userEmail}:`);
      console.error(`📛 Error name: ${error.name}`);
      console.error(`🔍 Error message: ${error.message}`);
      console.error(`💾 Error code: ${error.code || "No error code"}`);
      console.error(
        `🖥️ SMTP response: ${error.response || "No SMTP response"}`
      );
      console.error(`🔍 Command: ${error.command || "No command info"}`);
      console.error(`📚 Stack trace: ${error.stack || "No stack trace"}`);

      return false;
    }
  }

  // Test method
  async sendTestHtmlEmail(to, htmlContent = null) {
    try {
      const emailSettings = await this.loadEmailSettings();

      return this.sendCustomEmail(to, {
        customerName: "Test User",
        subject: "HTML Test Email - XenoNepal",
        message:
          "This is a test HTML email to verify styling works correctly.\n\nIf you can see styled content with colors and formatting, HTML emails are working!",
      });
    } catch (error) {
      console.error("Error in sendTestHtmlEmail:", error);
      return false;
    }
  }

  // Order completion email (sent when order is created)
  async sendOrderCompletionEmail(userEmail, orderData) {
    try {
      console.log(`📧 Sending order completion email to ${userEmail}`);

      const formattedOrderDate = new Date(
        orderData.createdAt
      ).toLocaleDateString();
      const discountInfo =
        orderData.discountAmount > 0
          ? `\n\nDiscount Applied: ${orderData.couponCode} (-NPR ${orderData.discountAmount})`
          : "";

      return this.sendCustomEmail(userEmail, {
        customerName:
          orderData.userName || orderData.billingName || "Valued Customer",
        subject: `🎮 Order Confirmed #${orderData.orderId} - XenoNepal`,
        message: `Great news! Your order has been confirmed and is now being processed.

Order Details:
• Order ID: #${orderData.orderId}
• Product: ${orderData.productName}
• Quantity: ${orderData.quantity}
• Total Amount: ${orderData.currency} ${orderData.totalAmount}
• Payment Method: ${orderData.paymentMethod}
• Order Date: ${formattedOrderDate}${discountInfo}

Game Details:
• Player ID: ${orderData.playerID || "Not provided"}
• Username: ${orderData.username || "Not provided"}

You'll receive another notification once your order is delivered. Thank you for choosing XenoNepal!

Track your order: https://xenonepal.com/user/orders`,
      });
    } catch (error) {
      console.error("Error in sendOrderCompletionEmail:", error);
      return false;
    }
  }

  // Order delivered email (sent when order status changes to delivered)
  async sendOrderDeliveredEmail(userEmail, orderData) {
    try {
      console.log(`📧 Sending order delivered email to ${userEmail}`);

      const deliveryDate = new Date().toLocaleDateString();

      return this.sendCustomEmail(userEmail, {
        customerName:
          orderData.userName || orderData.billingName || "Valued Customer",
        subject: `✅ Order Delivered #${orderData.orderId} - XenoNepal`,
        message: `Excellent! Your order has been successfully delivered.

Delivered Order Details:
• Order ID: #${orderData.orderId}
• Product: ${orderData.productName}
• Quantity: ${orderData.quantity}
• Total Amount: ${orderData.currency} ${orderData.totalAmount}
• Delivered On: ${deliveryDate}

Game Details:
• Player ID: ${orderData.playerID || "Not provided"}
• Username: ${orderData.username || "Not provided"}

Your gaming credits/subscription have been added to your account. Please check your game to confirm the delivery.

If you don't see the credits within 10 minutes, please contact our support team.

Enjoy your gaming experience! 🎮`,
      });
    } catch (error) {
      console.error("Error in sendOrderDeliveredEmail:", error);
      return false;
    }
  }

  // Admin new order notification
  async sendAdminNewOrderNotification(orderData) {
    try {
      console.log(
        `📧 Sending admin new order notification for order #${orderData.orderId}`
      );

      const emailSettings = await this.loadEmailSettings();
      const adminEmail = emailSettings.supportEmail || "xenonepal@gmail.com";

      const orderDate = new Date(orderData.createdAt).toLocaleDateString();
      const discountInfo =
        orderData.discountAmount > 0
          ? `\n• Discount Applied: ${orderData.couponCode} (-NPR ${orderData.discountAmount})`
          : "";

      return this.sendCustomEmail(adminEmail, {
        customerName: "Admin",
        subject: `🚨 New Order Alert #${orderData.orderId} - Action Required`,
        message: `A new order has been placed and requires processing.

Order Information:
• Order ID: #${orderData.orderId}
• Customer: ${orderData.customerName} (${orderData.customerEmail})
• Product: ${orderData.productName}
• Quantity: ${orderData.quantity}
• Total Amount: ${orderData.currency} ${orderData.totalAmount}
• Payment Method: ${orderData.paymentMethod}
• Order Date: ${orderDate}${discountInfo}

Game Details:
• Player ID: ${orderData.playerID || "Not provided"}
• Username: ${orderData.username || "Not provided"}

Customer Billing:
• Name: ${orderData.billingName}
• Email: ${orderData.billingEmail}
• Phone: ${orderData.billingPhone}

⚠️ Action Required: Please process this order promptly to ensure customer satisfaction.

View in Admin Panel: https://xenonepal.com/admin/orders`,
      });
    } catch (error) {
      console.error("Error in sendAdminNewOrderNotification:", error);
      return false;
    }
  }

  // Admin order status update notification
  async sendAdminOrderStatusUpdate(orderData, oldStatus, newStatus) {
    try {
      console.log(
        `📧 Sending admin status update notification for order #${orderData.orderId}`
      );

      const emailSettings = await this.loadEmailSettings();
      const adminEmail = emailSettings.supportEmail || "xenonepal@gmail.com";

      const updateDate = new Date().toLocaleDateString();

      return this.sendCustomEmail(adminEmail, {
        customerName: "Admin",
        subject: `📋 Order Status Updated #${
          orderData.orderId
        } - ${newStatus.toUpperCase()}`,
        message: `Order status has been updated in the system.

Status Change:
• Order ID: #${orderData.orderId}
• Previous Status: ${oldStatus || "Unknown"}
• New Status: ${newStatus.toUpperCase()}
• Update Date: ${updateDate}

Order Information:
• Customer: ${orderData.customerName} (${orderData.customerEmail})
• Product: ${orderData.productName}
• Total Amount: ${orderData.currency} ${orderData.totalAmount}
• Payment Method: ${orderData.paymentMethod}

Game Details:
• Player ID: ${orderData.playerID || "Not provided"}
• Username: ${orderData.username || "Not provided"}

Customer Billing:
• Name: ${orderData.billingName}
• Email: ${orderData.billingEmail}
• Phone: ${orderData.billingPhone}

View All Orders: https://xenonepal.com/admin/orders`,
      });
    } catch (error) {
      console.error("Error in sendAdminOrderStatusUpdate:", error);
      return false;
    }
  }

  // Exclusive coupon email (sent when coupon is created for specific users)
  async sendExclusiveCouponEmail(userEmail, userData, couponData) {
    try {
      console.log(`📧 Sending exclusive coupon email to ${userEmail}`);

      const expiryDate = new Date(couponData.expiresAt).toLocaleDateString();
      const issuedDate = new Date().toLocaleDateString();

      const discountText =
        couponData.discountType === "percentage"
          ? `${couponData.discountValue}% OFF${
              couponData.maxDiscount
                ? ` (Max: NPR ${couponData.maxDiscount})`
                : ""
            }`
          : `NPR ${couponData.discountValue} OFF`;

      return this.sendCustomEmail(userEmail, {
        customerName: userData.name || "Valued Customer",
        subject: `🎁 Exclusive Coupon Just for You: ${couponData.code} - XenoNepal`,
        message: `We're excited to share this exclusive coupon created especially for you!

🎉 YOUR EXCLUSIVE COUPON: ${couponData.code}

Discount: ${discountText}

Coupon Details:
• Code: ${couponData.code}
• Discount: ${discountText}
• Usage Limit: ${couponData.usagePerUser} time(s) for you personally
• Valid Until: ${expiryDate}
• Issued Date: ${issuedDate}

✨ This coupon is exclusively yours! Don't miss out on this special offer - it's valid for a limited time only.

How to use: Simply enter the coupon code "${couponData.code}" during checkout to apply your exclusive discount.

Start shopping now and save: https://xenonepal.com

Happy Gaming! 🎮`,
      });
    } catch (error) {
      console.error("Error in sendExclusiveCouponEmail:", error);
      return false;
    }
  }

  // Order cancelled email (for future use)
  async sendOrderCancelledEmail(userEmail, orderData) {
    try {
      console.log(`📧 Sending order cancelled email to ${userEmail}`);

      const cancelDate = new Date().toLocaleDateString();

      return this.sendCustomEmail(userEmail, {
        customerName:
          orderData.userName || orderData.billingName || "Valued Customer",
        subject: `❌ Order Cancelled #${orderData.orderId} - XenoNepal`,
        message: `We're sorry to inform you that your order has been cancelled.

Cancelled Order Details:
• Order ID: #${orderData.orderId}
• Product: ${orderData.productName}
• Quantity: ${orderData.quantity}
• Amount: ${orderData.currency} ${orderData.totalAmount}
• Cancelled On: ${cancelDate}

If this cancellation was unexpected or if you have any questions, please contact our support team immediately.

We apologize for any inconvenience caused and appreciate your understanding.

Contact Support: https://xenonepal.com/contact`,
      });
    } catch (error) {
      console.error("Error in sendOrderCancelledEmail:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
