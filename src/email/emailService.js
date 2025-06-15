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
  }

  async loadEmailSettings() {
    try {
      const settings = await Setting.findOne();
      if (settings && settings.emailSettings) {
        this.emailSettings = settings.emailSettings;
        return this.emailSettings;
      }

      // Fallback to environment variables
      return {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "Subhamsha@2053",
        emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
        supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
        enableEmailNotifications: true,
      };
    } catch (error) {
      console.error("Error loading email settings:", error);
      // Return environment fallback
      return {
        emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
        emailPassword: process.env.EMAIL_PASSWORD || "Subhamsha@2053",
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
      } // Using Gmail SMTP (free service)
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailSettings.emailUser,
          pass: emailSettings.emailPassword, // Use App Password for Gmail
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log(
        "Email service initialized successfully with user:",
        emailSettings.emailUser
      );
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      // Don't throw error, just log it so the app can still run
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
      const template = Handlebars.compile(templateContent);
      return template(variables);
    } catch (error) {
      console.error("Error compiling template:", error);
      return templateContent;
    }
  }
  async sendEmail({ to, templateType, variables = {} }) {
    try {
      if (!this.transporter) {
        console.log("Email service not initialized, skipping email send");
        return false;
      }

      // Refresh email settings in case they changed (cached)
      const emailSettings = await this.loadEmailSettings();

      if (!emailSettings.enableEmailNotifications) {
        console.log("Email notifications are disabled, skipping email send");
        return false;
      }

      const template = await this.getTemplate(templateType);
      if (!template) {
        console.log(`Email template not found for type: ${templateType}`);
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
        html: htmlContent,
        text: textContent,
      };

      // Send email with timeout to prevent hanging
      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Email send timeout")), 30000)
        ),
      ]);

      console.log(`Email sent successfully to ${to}:`, info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  // Specific methods for different email types
  async sendOrderCompletionEmail(userEmail, orderData) {
    return await this.sendEmail({
      to: userEmail,
      templateType: "order_completion",
      variables: {
        userName: orderData.userName || "Valued Customer",
        orderId: orderData.orderId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
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
        userName: orderData.userName || "Valued Customer",
        orderId: orderData.orderId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
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
        userName: userData.name || "New User",
        userEmail: userData.email,
        registrationDate: new Date().toLocaleDateString(),
      },
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
      }

      // Send to all admins in parallel for efficiency
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
            totalAmount: orderData.totalAmount,
            currency: orderData.currency,
            playerID: orderData.playerID,
            username: orderData.username,
            paymentMethod: orderData.paymentMethod,
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
            totalAmount: orderData.totalAmount,
            currency: orderData.currency,
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
}

module.exports = new EmailService();
