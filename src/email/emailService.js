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
}

module.exports = new EmailService();
