const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const EmailTemplate = require("./emailTemplate.model");
const Setting = require("../settings/setting.model");

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailSettings = null;
    this.adminEmails = [];
    this.adminEmailsLastFetch = 0;
    this.templateCache = new Map();
    this.templateCacheExpiry = 300000; // 5 minutes
    this.initializeTransporter();
    this.registerHandlebarsHelpers();
  }

  // Register Handlebars helpers for template processing
  registerHandlebarsHelpers() {
    // Register equality helper
    Handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });

    // Register if helper for better conditional logic
    Handlebars.registerHelper("if_eq", function (a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Register currency format helper
    Handlebars.registerHelper("currency", function (amount) {
      return `NPR ${amount}`;
    });
  }

  async loadEmailSettings() {
    try {
      const settings = await Setting.findOne();
      if (settings && settings.emailSettings) {
        this.emailSettings = settings.emailSettings;
        return this.emailSettings;
      } // Fallback to environment variables
      const envSettings = {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
        emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
        supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
        enableEmailNotifications: true,
      };

      return envSettings;
    } catch (error) {
      console.error("Error loading email settings:", error);
      // Return environment fallback
      return {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
        emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
        supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
        enableEmailNotifications: true,
      };
    }
  }
  async initializeTransporter() {
    try {
      // Load email settings from database or environment
      const emailSettings = await this.loadEmailSettings();

      if (!emailSettings.enableEmailNotifications) {
        console.log("Email notifications are disabled");
        return;
      }

      // Validate required email settings
      if (!emailSettings.emailUser || !emailSettings.emailPassword) {
        console.error("❌ MISSING EMAIL CREDENTIALS:", {
          hasEmailUser: !!emailSettings.emailUser,
          hasEmailPassword: !!emailSettings.emailPassword,
          emailUser: emailSettings.emailUser,
        });
        return;
      } // Using Gmail SMTP (free service)
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: emailSettings.emailUser,
          pass: emailSettings.emailPassword, // Use App Password for Gmail
        },
        // Ensure proper HTML support
        tls: {
          rejectUnauthorized: false,
          ciphers: "SSLv3",
        },
        // Additional options for better email delivery
        pool: true,
        maxConnections: 1,
        rateDelta: 20000,
        rateLimit: 5,
        // Add timeout to prevent hanging
        connectionTimeout: 60000, // 60 seconds
        socketTimeout: 60000, // 60 seconds
        // Ensure proper encoding for HTML emails
        defaults: {
          from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log("✅ Email service initialized successfully!");

      // Store settings for later use
      this.emailSettings = emailSettings;
    } catch (error) {
      console.error("❌ FAILED TO INITIALIZE EMAIL SERVICE:");
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error command:", error.command);
      console.error("Response code:", error.responseCode);
      console.error("Response:", error.response);

      // Common Gmail errors and solutions
      if (error.code === "EAUTH") {
        console.error("🔑 AUTHENTICATION ERROR:");
        console.error(
          "- Make sure you are using Gmail App Password, not regular password"
        );
        console.error("- Enable 2-Factor Authentication on Gmail");
        console.error(
          "- Generate App Password: https://myaccount.google.com/apppasswords"
        );
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        console.error("🌐 NETWORK ERROR:");
        console.error("- Check internet connection");
        console.error("- Verify firewall/proxy settings");
      }

      // In production, attempt retry
      if (process.env.NODE_ENV === "production") {
        console.log("⏰ Production retry in 30 seconds...");
        setTimeout(() => {
          this.initializeTransporter();
        }, 30000);
      }
    }
  }

  async reinitializeTransporter() {
    // Method to reinitialize transporter when settings change
    return this.initializeTransporter();
  }
  async getTemplate(type) {
    try {
      // Check cache first to reduce database queries
      const cacheKey = `template_${type}`;
      const now = Date.now();
      if (this.templateCache.has(cacheKey)) {
        const cached = this.templateCache.get(cacheKey);
        if (now - cached.timestamp < this.templateCacheExpiry) {
          return cached.template;
        }
        this.templateCache.delete(cacheKey);
      }
      const template = await EmailTemplate.findOne({ type, isActive: true });

      // If template not found, try to auto-initialize it
      if (!template) {
        // Check if it's a known template type that should exist
        const knownTypes = [
          "order_completion",
          "order_delivered",
          "user_registration",
          "welcome",
          "test_email",
          "admin_new_order",
          "admin_order_status_update",
          "exclusive_coupon",
        ];

        if (knownTypes.includes(type)) {
          // Try to initialize default templates
          try {
            const {
              initializeDefaultTemplates,
            } = require("./emailTemplate.controller");
            await initializeDefaultTemplates();

            // Try to find the template again
            const newTemplate = await EmailTemplate.findOne({
              type,
              isActive: true,
            });
            if (newTemplate) {
              this.templateCache.set(cacheKey, {
                template: newTemplate,
                timestamp: now,
              });
              return newTemplate;
            }
          } catch (error) {
            console.error(`Failed to auto-create template ${type}:`, error);
          }
        }

        return null;
      }

      // Cache the template for better performance
      if (template) {
        this.templateCache.set(cacheKey, {
          template,
          timestamp: now,
        });
      }

      return template;
    } catch (error) {
      console.error("Error fetching email template:", error);
      return null;
    }
  }
  compileTemplate(templateContent, variables) {
    try {
      if (!templateContent) {
        return "";
      }

      const template = Handlebars.compile(templateContent);
      const compiled = template(variables);
      return compiled;
    } catch (error) {
      console.error("Error compiling template:", error);
      console.error("Template content:", templateContent);
      console.error("Variables:", variables);
      return templateContent; // Return original content if compilation fails
    }
  }
  async sendEmail({ to, templateType, variables = {} }) {
    try {
      if (!this.transporter) {
        console.error(
          "❌ Email service not initialized, attempting to reinitialize..."
        );
        await this.initializeTransporter();
        if (!this.transporter) {
          console.error("❌ Failed to initialize email service");
          return false;
        }
      }

      // Refresh email settings in case they changed (cached)
      const emailSettings = await this.loadEmailSettings();

      if (!emailSettings.enableEmailNotifications) {
        console.log("⚠️ Email notifications are disabled, skipping email send");
        return false;
      }

      const template = await this.getTemplate(templateType);
      if (!template) {
        console.error(`❌ Email template not found for type: ${templateType}`);
        return false;
      }

      // Validate template content
      if (!template.htmlContent && !template.textContent) {
        console.error(`❌ Email template ${templateType} has no content`);
        return false;
      }

      // Add default variables using current settings
      const defaultVariables = {
        appName: "XenoNepal",
        currentYear: new Date().getFullYear(),
        supportEmail: emailSettings.supportEmail,
        websiteUrl: "https://xenonepal.com",
        ...variables,
      };

      const htmlContent = this.compileTemplate(
        template.htmlContent,
        defaultVariables
      );
      const textContent = this.compileTemplate(
        template.textContent,
        defaultVariables
      );
      const subject = this.compileTemplate(template.subject, defaultVariables);

      const mailOptions = {
        from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
        to,
        subject,
        // Use proper MIME structure to ensure HTML is displayed
        html: htmlContent && htmlContent.trim() ? htmlContent : undefined,
        text:
          textContent && textContent.trim()
            ? textContent
            : "Please enable HTML view to see this email properly.",
        // Additional headers to ensure proper HTML rendering
        headers: {
          "X-Priority": "3",
          "X-MSMail-Priority": "Normal",
          Importance: "Normal",
          "MIME-Version": "1.0",
        },
        // Force multipart/alternative structure
        alternatives:
          htmlContent && htmlContent.trim()
            ? [
                {
                  contentType: "text/html; charset=utf-8",
                  content: htmlContent,
                },
              ]
            : undefined,
      };

      // Send email with timeout to prevent hanging
      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Email send timeout")), 30000)
        ),
      ]);
      console.log(`✅ Email sent successfully to ${to} (${templateType})`);
      return true;
    } catch (error) {
      console.error(`❌ ERROR SENDING EMAIL to ${to}:`);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error stack:", error.stack);

      // Specific error handling for common Gmail SMTP errors
      if (error.code === "EAUTH") {
        console.error("🔑 Authentication failed - check Gmail App Password");
      } else if (error.code === "EENVELOPE") {
        console.error("📧 Invalid email address");
      } else if (error.code === "EMESSAGE") {
        console.error("📝 Invalid message content");
      } else if (error.message.includes("timeout")) {
        console.error("⏰ Email send timeout - network issue");
      }

      // Try to reinitialize transporter on auth errors
      if (error.code === "EAUTH" && process.env.NODE_ENV === "production") {
        console.log("🔄 Attempting to reinitialize email service...");
        setTimeout(() => this.initializeTransporter(), 5000);
      }

      return false;
    }
  }

  // Specific methods for different email types
  async sendOrderCompletionEmail(userEmail, orderData) {
    return await this.sendEmail({
      to: userEmail,
      templateType: "order_completion",
      variables: {
        customerName: orderData.userName || "Valued Customer",
        orderId: orderData.orderId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        amount: orderData.amount || orderData.totalAmount,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        paymentMethod: orderData.paymentMethod ?? "N/A",
        billingName:
          orderData.billingName || orderData.customerName || orderData.userName,
        billingEmail:
          orderData.billingEmail || orderData.customerEmail || userEmail,
        billingPhone: orderData.billingPhone ?? "N/A",
        playerID: orderData.playerID,
        username: orderData.username,
        orderDate: new Date(orderData.createdAt).toLocaleDateString(),
      },
    });
  }
  async sendOrderDeliveredEmail(userEmail, orderData) {
    return await this.sendEmail({
      to: userEmail,
      templateType: "order_delivered",
      variables: {
        customerName: orderData.userName || "Valued Customer",
        orderId: orderData.orderId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        amount: orderData.amount || orderData.totalAmount,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        paymentMethod: orderData.paymentMethod ?? "N/A",
        billingName:
          orderData.billingName || orderData.customerName || orderData.userName,
        billingEmail:
          orderData.billingEmail || orderData.customerEmail || userEmail,
        billingPhone: orderData.billingPhone ?? "N/A",
        playerID: orderData.playerID,
        username: orderData.username,
        deliveryDate: new Date().toLocaleDateString(),
      },
    });
  }
  async sendWelcomeEmail(userEmail, userData) {
    return await this.sendEmail({
      to: userEmail,
      templateType: "user_registration",
      variables: {
        customerName: userData.name || "New User",
        userEmail: userData.email,
        registrationDate: new Date().toLocaleDateString(),
      },
    });
  }
  async sendExclusiveCouponEmail(userEmail, userData, couponData) {
    // Pre-process discount information for easier template usage
    const isPercentage = couponData.discountType === "percentage";
    let discountDisplay, discountText;

    if (isPercentage) {
      discountDisplay = `${couponData.discountValue}% OFF`;
      if (couponData.maxDiscount && couponData.maxDiscount > 0) {
        discountDisplay += ` (Max NPR ${couponData.maxDiscount})`;
      }
      discountText = `${couponData.discountValue}% off your purchase`;
      if (couponData.maxDiscount && couponData.maxDiscount > 0) {
        discountText += `. Maximum discount: NPR ${couponData.maxDiscount}`;
      }
    } else {
      discountDisplay = `NPR ${couponData.discountValue} OFF`;
      discountText = `NPR ${couponData.discountValue} off your purchase`;
    }

    const variables = {
      customerName: userData.name || "Valued Customer",
      userEmail: userData.email,
      couponCode: couponData.code,
      discountValue: couponData.discountValue,
      discountType: couponData.discountType,
      maxDiscount: couponData.maxDiscount,
      discountDisplay: discountDisplay,
      discountText: discountText,
      isPercentage: isPercentage,
      expiryDate: new Date(couponData.expiresAt).toLocaleDateString(),
      usageLimit: couponData.usageLimit,
      usagePerUser: couponData.usagePerUser,
      issuedDate: new Date().toLocaleDateString(),
    };

    console.log("🎯 Sending exclusive coupon email with variables:", {
      to: userEmail,
      customerName: variables.customerName,
      couponCode: variables.couponCode,
      discountDisplay: variables.discountDisplay,
      discountText: variables.discountText,
    });

    return await this.sendEmail({
      to: userEmail,
      templateType: "exclusive_coupon",
      variables: variables,
    });
  }

  // Admin notification methods - optimized for minimal server load
  async getAdminEmails() {
    try {
      // Cache admin emails to reduce database queries
      if (
        !this.adminEmails ||
        Date.now() - this.adminEmailsLastFetch > 300000
      ) {
        // Cache for 5 minutes
        const User = require("../user/user.model");
        const admins = await User.find({ role: "admin", status: "active" })
          .select("email")
          .lean();
        this.adminEmails = admins.map((admin) => admin.email).filter(Boolean);
        this.adminEmailsLastFetch = Date.now();
      }
      return this.adminEmails;
    } catch (error) {
      console.error("Error fetching admin emails:", error);
      return [];
    }
  }

  async sendAdminNewOrderNotification(orderData) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.log("No admin emails found for new order notification");
        return false;
      } // Send to all admins in parallel for efficiency
      const emailPromises = adminEmails.map((adminEmail) =>
        this.sendEmail({
          to: adminEmail,
          templateType: "admin_new_order",
          variables: {
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            productName: orderData.productName,
            quantity: orderData.quantity,
            amount: orderData.amount || orderData.totalAmount,
            totalAmount: orderData.totalAmount,
            currency: orderData.currency,
            paymentMethod: orderData.paymentMethod ?? "N/A",
            billingName: orderData.billingName || orderData.customerName,
            billingEmail: orderData.billingEmail || orderData.customerEmail,
            billingPhone: orderData.billingPhone ?? "N/A",
            playerID: orderData.playerID,
            username: orderData.username,
            orderDate: new Date(orderData.createdAt).toLocaleDateString(),
          },
        }).catch((error) => {
          console.error(
            `Failed to send admin notification to ${adminEmail}:`,
            error
          );
          return false;
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;
      console.log(
        `Admin new order notifications sent to ${successCount}/${adminEmails.length} admins`
      );
      return successCount > 0;
    } catch (error) {
      console.error("Error sending admin new order notification:", error);
      return false;
    }
  }

  async sendAdminOrderStatusUpdate(orderData, oldStatus, newStatus) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.log(
          "No admin emails found for order status update notification"
        );
        return false;
      }

      // Send to all admins in parallel for efficiency
      const emailPromises = adminEmails.map((adminEmail) =>
        this.sendEmail({
          to: adminEmail,
          templateType: "admin_order_status_update",
          variables: {
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            productName: orderData.productName,
            oldStatus: oldStatus,
            newStatus: newStatus,
            amount: orderData.amount || orderData.totalAmount,
            totalAmount: orderData.totalAmount,
            currency: orderData.currency,
            paymentMethod: orderData.paymentMethod ?? "N/A",
            billingName: orderData.billingName || orderData.customerName,
            billingEmail: orderData.billingEmail || orderData.customerEmail,
            billingPhone: orderData.billingPhone ?? "N/A",
            playerID: orderData.playerID,
            username: orderData.username,
            updateDate: new Date().toLocaleDateString(),
          },
        }).catch((error) => {
          console.error(
            `Failed to send admin status update to ${adminEmail}:`,
            error
          );
          return false;
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;
      console.log(
        `Admin order status update notifications sent to ${successCount}/${adminEmails.length} admins`
      );
      return successCount > 0;
    } catch (error) {
      console.error(
        "Error sending admin order status update notification:",
        error
      );
      return false;
    }
  }

  // Method to explicitly test HTML email sending
  async sendTestHtmlEmail(to, htmlContent = null) {
    try {
      if (!this.transporter) {
        console.log("Email service not initialized");
        return false;
      }

      const emailSettings = await this.loadEmailSettings();

      const testHtmlContent =
        htmlContent ||
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HTML Test Email</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
    .content { color: #333; line-height: 1.6; }
    .highlight { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 HTML Email Test</h1>
      <p>XenoNepal Email Service</p>
    </div>
    <div class="content">
      <h2>This is an HTML Email!</h2>
      <p>If you can see <strong>bold text</strong>, <em>italic text</em>, and the styled header above, then HTML emails are working correctly.</p>
      
      <div class="highlight">
        <h3>✅ HTML Features Test:</h3>
        <ul>
          <li>CSS Styling: <span style="color: #28a745;">✓ Working</span></li>
          <li>HTML Structure: <span style="color: #28a745;">✓ Working</span></li>
          <li>Font Formatting: <span style="color: #28a745;">✓ Working</span></li>
          <li>Color Support: <span style="color: #dc3545;">Red</span> <span style="color: #007bff;">Blue</span> <span style="color: #28a745;">Green</span></li>
        </ul>
      </div>
      
      <p>Email sent at: ${new Date().toLocaleString()}</p>
      <p><strong>From:</strong> XenoNepal Gaming Platform</p>
    </div>
  </div>
</body>
</html>`;

      const mailOptions = {
        from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
        to,
        subject: "🎮 HTML Email Test - XenoNepal",
        html: testHtmlContent,
        // Include minimal text version
        text: "This is a test HTML email from XenoNepal. If you see this text, please enable HTML view in your email client.",
        headers: {
          "X-Priority": "3",
          "Content-Type": "text/html; charset=utf-8",
        },
      };

      console.log("Sending test HTML email...");
      console.log("HTML Content length:", testHtmlContent.length);

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Test HTML email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending test HTML email:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
