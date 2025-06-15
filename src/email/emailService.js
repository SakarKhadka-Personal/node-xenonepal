const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const EmailTemplate = require("./emailTemplate.model");
const Setting = require("../settings/setting.model");

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailSettings = null;
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
      const template = await EmailTemplate.findOne({ type, isActive: true });
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

      // Refresh email settings in case they changed
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

      const info = await this.transporter.sendMail(mailOptions);
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
}

module.exports = new EmailService();
