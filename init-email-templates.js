require("dotenv").config();
const EmailTemplate = require("./src/email/emailTemplate.model");
const dbConnect = require("./src/config/db");

// Check if MONGO_URI is set
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI environment variable is not set!");
  console.log(
    "Please create a .env file with MONGO_URI=your-mongodb-connection-string"
  );
  process.exit(1);
}

// Initialize default email templates
const initializeEmailTemplates = async () => {
  try {
    await dbConnect();

    const templates = [
      {
        type: "test_email",
        subject: "Test Email from {{appName}}",
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px;">
                <h1 style="color: #333;">Test Email from {{appName}}</h1>
                <p>Hello!</p>
                <p>{{testMessage}}</p>
                <p>If you received this email, your email configuration is working correctly.</p>
                <p>Best regards,<br>{{appName}} Team</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                  This is a test email sent from {{appName}} email service.<br>
                  Support: {{supportEmail}}<br>
                  Website: {{websiteUrl}}
                </p>
              </div>
            </body>
          </html>
        `,
        textContent: `
Test Email from {{appName}}

Hello!

{{testMessage}}

If you received this email, your email configuration is working correctly.

Best regards,
{{appName}} Team

---
This is a test email sent from {{appName}} email service.
Support: {{supportEmail}}
Website: {{websiteUrl}}
        `,
        availableVariables: [
          "appName",
          "testMessage",
          "supportEmail",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "order_completion",
        subject: "Order Confirmation - {{appName}}",
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px;">
                <h1 style="color: #28a745;">Order Completed Successfully!</h1>
                <p>Dear {{customerName}},</p>
                <p>Your order <strong>#{{orderId}}</strong> has been completed successfully.</p>
                <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                  <h3>Order Details:</h3>
                  <p><strong>Product:</strong> {{productName}}</p>
                  <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
                  <p><strong>Status:</strong> Completed</p>
                </div>
                <p>Thank you for choosing {{appName}}!</p>
                <p>Best regards,<br>{{appName}} Team</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                  Support: {{supportEmail}}<br>
                  Website: {{websiteUrl}}
                </p>
              </div>
            </body>
          </html>
        `,
        textContent: `
Order Completed Successfully!

Dear {{customerName}},

Your order #{{orderId}} has been completed successfully.

Order Details:
- Product: {{productName}}
- Amount: {{amount}} {{currency}}
- Status: Completed

Thank you for choosing {{appName}}!

Best regards,
{{appName}} Team

---
Support: {{supportEmail}}
Website: {{websiteUrl}}
        `,
        availableVariables: [
          "customerName",
          "orderId",
          "productName",
          "amount",
          "currency",
          "appName",
          "supportEmail",
          "websiteUrl",
        ],
      },
    ];

    for (const template of templates) {
      await EmailTemplate.findOneAndUpdate({ type: template.type }, template, {
        upsert: true,
        new: true,
      });
      console.log(`Email template '${template.type}' initialized`);
    }

    console.log("All email templates initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing email templates:", error);
    process.exit(1);
  }
};

initializeEmailTemplates();
