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
        return;
      } // Using Gmail SMTP (free service)
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailSettings.emailUser,
          pass: emailSettings.emailPassword, // Use App Password for Gmail
        },
        // Ensure proper HTML support
        tls: {
          rejectUnauthorized: false,
        },
        // Additional options for better email delivery
        pool: true,
        maxConnections: 1,
        rateDelta: 20000,
        rateLimit: 5,
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
          console.log(`Template ${type} found in cache`);
          return cached.template;
        }
        this.templateCache.delete(cacheKey);
      }

      console.log(`Looking for template type: ${type}`);
      const template = await EmailTemplate.findOne({ type, isActive: true });

      // If template not found, try to auto-initialize it
      if (!template) {
        console.log(
          `Template ${type} not found, checking if we should auto-create it`
        );

        // Check if it's a known template type that should exist
        const knownTypes = [
          "order_completion",
          "order_delivered",
          "user_registration",
          "welcome",
          "test_email",
          "admin_new_order",
          "admin_order_status_update",
        ];

        if (knownTypes.includes(type)) {
          console.log(`Attempting to create missing template: ${type}`);
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
              console.log(`Successfully created and found template: ${type}`);
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
        console.log(`Template ${type} found in database`);
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
        console.log("Template content is empty or null");
        return "";
      }

      console.log(
        `Compiling template with content length: ${templateContent.length}`
      );
      const template = Handlebars.compile(templateContent);
      const compiled = template(variables);
      console.log(`Compiled template result length: ${compiled.length}`);
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

      // Validate template content
      if (!template.htmlContent && !template.textContent) {
        console.log(`Email template ${templateType} has no content`);
        return false;
      }

      // Log template details for debugging
      console.log(
        `Template found: ${templateType}, has HTML: ${!!template.htmlContent}, has Text: ${!!template.textContent}`
      );

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

      // Debug logging to see what content is being sent
      console.log(`\n=== EMAIL DEBUG INFO ===`);
      console.log(`Template Type: ${templateType}`);
      console.log(`Subject: ${subject}`);
      console.log(
        `HTML Content Length: ${htmlContent ? htmlContent.length : 0}`
      );
      console.log(
        `Text Content Length: ${textContent ? textContent.length : 0}`
      );
      console.log(
        `HTML Content Preview: ${
          htmlContent ? htmlContent.substring(0, 200) : "No HTML content"
        }...`
      );
      console.log(`=========================\n`);
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
