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
      {
        type: "admin_new_order",
        subject: "🚨 New Order Alert - {{orderId}} | {{appName}}",
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
                <h1>🚨 New Order Alert!</h1>
                <p>A new order has been placed on {{appName}}</p>
              </div>
              <div style="padding: 20px;">
                <p><strong>Action Required:</strong> A new order has been received and requires processing.</p>
                
                <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107;">
                  <h3>📋 Order Details:</h3>
                  <p><strong>Order ID:</strong> {{orderId}}</p>
                  <p><strong>Product:</strong> {{productName}}</p>
                  <p><strong>Quantity:</strong> {{quantity}}</p>
                  <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
                  <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
                  <p><strong>Order Date:</strong> {{orderDate}}</p>
                </div>

                <div style="background-color: #d1ecf1; padding: 15px; margin: 15px 0; border-left: 4px solid #0dcaf0;">
                  <h3>👤 Customer Information:</h3>
                  <p><strong>Name:</strong> {{customerName}}</p>
                  <p><strong>Email:</strong> {{customerEmail}}</p>
                  <p><strong>Player ID:</strong> {{playerID}}</p>
                </div>
                
                <p>Please process this order promptly to ensure customer satisfaction.</p>
                
                <a href="{{websiteUrl}}/admin/orders" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
              </div>
            </body>
          </html>
        `,
        textContent: `🚨 NEW ORDER ALERT - {{orderId}}

A new order has been placed on {{appName}} and requires processing.

📋 ORDER DETAILS:
- Order ID: {{orderId}}
- Product: {{productName}}
- Quantity: {{quantity}}
- Total Amount: {{currency}} {{totalAmount}}
- Payment Method: {{paymentMethod}}
- Order Date: {{orderDate}}

👤 CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Player ID: {{playerID}}

ACTION REQUIRED: Please process this order promptly.

View in Admin Panel: {{websiteUrl}}/admin/orders

---
{{appName}} Admin Notification System`,
        availableVariables: [
          "orderId",
          "customerName",
          "customerEmail",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "playerID",
          "username",
          "paymentMethod",
          "orderDate",
          "appName",
          "websiteUrl",
        ],
      },
      {
        type: "admin_order_status_update",
        subject: "📋 Order Status Update - {{orderId}} | {{appName}}",
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #6f42c1; color: white; padding: 20px; text-align: center;">
                <h1>📋 Order Status Updated</h1>
                <p>Order {{orderId}} status has been changed</p>
              </div>
              <div style="padding: 20px;">
                <div style="background-color: #e7f3ff; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
                  <h3>📊 Status Change:</h3>
                  <p><strong>Order ID:</strong> {{orderId}}</p>
                  <p><strong>Previous Status:</strong> {{oldStatus}}</p>
                  <p><strong>New Status:</strong> {{newStatus}}</p>
                  <p><strong>Update Date:</strong> {{updateDate}}</p>
                </div>

                <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0;">
                  <h3>📋 Order Information:</h3>
                  <p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
                  <p><strong>Product:</strong> {{productName}}</p>
                  <p><strong>Amount:</strong> {{currency}} {{totalAmount}}</p>
                  <p><strong>Player ID:</strong> {{playerID}}</p>
                </div>
                
                <a href="{{websiteUrl}}/admin/orders" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View All Orders</a>
              </div>
            </body>
          </html>
        `,
        textContent: `📋 ORDER STATUS UPDATE - {{orderId}}

Order {{orderId}} status has been updated on {{appName}}.

📊 STATUS CHANGE:
- Order ID: {{orderId}}
- Previous Status: {{oldStatus}}
- New Status: {{newStatus}}
- Update Date: {{updateDate}}

📋 ORDER INFORMATION:
- Customer: {{customerName}} ({{customerEmail}})
- Product: {{productName}}
- Amount: {{currency}} {{totalAmount}}
- Player ID: {{playerID}}

View All Orders: {{websiteUrl}}/admin/orders

---
{{appName}} Admin Notification System`,
        availableVariables: [
          "orderId",
          "customerName",
          "customerEmail",
          "productName",
          "oldStatus",
          "newStatus",
          "totalAmount",
          "currency",
          "playerID",
          "username",
          "updateDate",
          "appName",
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
