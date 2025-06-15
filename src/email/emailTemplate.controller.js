const EmailTemplate = require("./emailTemplate.model");

// Get all email templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ type: 1 });
    res.status(200).json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single email template
const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error("Error fetching email template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new email template
const createTemplate = async (req, res) => {
  try {
    const {
      type,
      subject,
      htmlContent,
      textContent,
      isActive,
      availableVariables,
    } = req.body;

    // Check if template type already exists
    const existingTemplate = await EmailTemplate.findOne({ type });
    if (existingTemplate) {
      return res.status(400).json({ message: "Template type already exists" });
    }

    const newTemplate = new EmailTemplate({
      type,
      subject,
      htmlContent,
      textContent,
      isActive,
      availableVariables,
    });

    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update email template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete email template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Initialize default templates
const initializeDefaultTemplates = async (req, res) => {
  try {
    const defaultTemplates = [
      {
        type: "order_completion",
        subject: "Order Confirmed - {{orderId}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order with {{appName}}</p>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>Your order has been successfully confirmed and is being processed. Here are your order details:</p>
      
      <div class="order-details">
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
        <p><strong>Order Date:</strong> {{orderDate}}</p>
      </div>
      
      <p>Your order is now in queue for processing. You will receive another email once your order has been delivered.</p>
      
      <a href="{{websiteUrl}}/order-history" class="btn">Track Your Order</a>
    </div>
    <div class="footer">
      <p>Thank you for choosing {{appName}}!</p>
      <p>If you have any questions, please contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Order Confirmed - {{orderId}}

Dear {{userName}},

Your order has been successfully confirmed and is being processed.

Order Details:
- Order ID: {{orderId}}
- Product: {{productName}}
- Quantity: {{quantity}}
- Total Amount: {{currency}} {{totalAmount}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}
- Order Date: {{orderDate}}

Your order is now in queue for processing. You will receive another email once your order has been delivered.

Visit {{websiteUrl}}/order-history to track your order.

Thank you for choosing {{appName}}!

If you have any questions, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        availableVariables: [
          "userName",
          "orderId",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "playerID",
          "username",
          "orderDate",
          "appName",
          "supportEmail",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "order_delivered",
        subject: "Order Delivered - {{orderId}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .order-details { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .success-icon { font-size: 48px; color: #28a745; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Order Delivered!</h1>
      <p>Your {{appName}} order has been completed</p>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>Great news! Your order has been successfully delivered. Your gaming credits/subscription has been added to your account.</p>
      
      <div class="order-details">
        <h3>Delivered Order Details:</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
        <p><strong>Delivered On:</strong> {{deliveryDate}}</p>
      </div>
      
      <p>Please check your game account to confirm the credits have been added. If you don't see the credits within 5-10 minutes, please contact our support team.</p>
      
      <a href="{{websiteUrl}}" class="btn">Shop Again</a>
      <a href="{{websiteUrl}}/order-history" class="btn">View Order History</a>
    </div>
    <div class="footer">
      <p>Thank you for choosing {{appName}}! We appreciate your business.</p>
      <p>Rate your experience or contact support: {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Order Delivered - {{orderId}}

Dear {{userName}},

Great news! Your order has been successfully delivered.

Delivered Order Details:
- Order ID: {{orderId}}
- Product: {{productName}}
- Quantity: {{quantity}}
- Total Amount: {{currency}} {{totalAmount}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}
- Delivered On: {{deliveryDate}}

Please check your game account to confirm the credits have been added. If you don't see the credits within 5-10 minutes, please contact our support team.

Visit {{websiteUrl}} to shop again or {{websiteUrl}}/order-history to view your order history.

Thank you for choosing {{appName}}! We appreciate your business.

If you have any questions, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        availableVariables: [
          "userName",
          "orderId",
          "productName",
          "quantity",
          "totalAmount",
          "currency",
          "playerID",
          "username",
          "deliveryDate",
          "appName",
          "supportEmail",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "user_registration",
        subject: "Welcome to {{appName}} - Your Gaming Journey Starts Here!",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{appName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .welcome-box { background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .features { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .feature { background-color: #e9ecef; padding: 10px; border-radius: 5px; flex: 1; min-width: 200px; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .welcome-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="welcome-icon">🎮</div>
      <h1>Welcome to {{appName}}!</h1>
      <p>Your gaming adventure starts here</p>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>Welcome to {{appName}}! We're excited to have you join our community of gamers across Nepal.</p>
      
      <div class="welcome-box">
        <h3>Account Created Successfully!</h3>
        <p><strong>Email:</strong> {{userEmail}}</p>
        <p><strong>Registration Date:</strong> {{registrationDate}}</p>
      </div>
      
      <h3>What You Can Do With {{appName}}:</h3>
      <div class="features">
        <div class="feature">
          <h4>🎯 Gaming Top-ups</h4>
          <p>PUBG UC, Free Fire Diamonds, CODM CP, and more</p>
        </div>
        <div class="feature">
          <h4>📺 Digital Subscriptions</h4>
          <p>Netflix, Amazon Prime, VPN services</p>
        </div>
        <div class="feature">
          <h4>🎁 Gift Cards</h4>
          <p>Steam, PlayStation, Xbox, and other gaming platforms</p>
        </div>
        <div class="feature">
          <h4>⚡ Instant Delivery</h4>
          <p>Get your credits delivered within minutes</p>
        </div>
      </div>
      
      <p>Start exploring our wide range of gaming products and services. Our team is here to support you 24/7!</p>
      
      <a href="{{websiteUrl}}" class="btn">Start Shopping</a>
      <a href="{{websiteUrl}}/user/profile" class="btn">Complete Profile</a>
    </div>
    <div class="footer">
      <p>Thank you for joining {{appName}}! Happy Gaming! 🎮</p>
      <p>Need help? Contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Welcome to {{appName}}!

Dear {{userName}},

Welcome to {{appName}}! We're excited to have you join our community of gamers across Nepal.

Account Created Successfully!
- Email: {{userEmail}}
- Registration Date: {{registrationDate}}

What You Can Do With {{appName}}:
🎯 Gaming Top-ups: PUBG UC, Free Fire Diamonds, CODM CP, and more
📺 Digital Subscriptions: Netflix, Amazon Prime, VPN services
🎁 Gift Cards: Steam, PlayStation, Xbox, and other gaming platforms
⚡ Instant Delivery: Get your credits delivered within minutes

Start exploring our wide range of gaming products and services. Our team is here to support you 24/7!

Visit {{websiteUrl}} to start shopping or {{websiteUrl}}/user/profile to complete your profile.

Thank you for joining {{appName}}! Happy Gaming!

Need help? Contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        availableVariables: [
          "userName",
          "userEmail",
          "registrationDate",
          "appName",
          "supportEmail",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "admin_new_order",
        subject: "🚨 New Order Alert - {{orderId}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .order-details { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .customer-details { background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0dcaf0; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .alert-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-icon">🚨</div>
      <h1>New Order Alert!</h1>
      <p>A new order has been placed on {{appName}}</p>
    </div>
    <div class="content">
      <p><strong>Action Required:</strong> A new order has been received and requires processing.</p>
      
      <div class="order-details">
        <h3>📋 Order Details:</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
      </div>

      <div class="customer-details">
        <h3>👤 Customer Information:</h3>
        <p><strong>Name:</strong> {{customerName}}</p>
        <p><strong>Email:</strong> {{customerEmail}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
      </div>
      
      <p>Please process this order promptly to ensure customer satisfaction.</p>
      
      <a href="{{websiteUrl}}/admin/orders" class="btn">View in Admin Panel</a>
    </div>
    <div class="footer">
      <p>{{appName}} Admin Notification System</p>
      <p>This is an automated notification for admins only</p>
    </div>
  </div>
</body>
</html>`,
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
{{#if username}}- Username: {{username}}{{/if}}

ACTION REQUIRED: Please process this order promptly to ensure customer satisfaction.

View in Admin Panel: {{websiteUrl}}/admin/orders

---
{{appName}} Admin Notification System
This is an automated notification for admins only`,
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
          "currentYear",
        ],
      },
      {
        type: "admin_order_status_update",
        subject: "📋 Order Status Update - {{orderId}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .status-update { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
    .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .update-icon { font-size: 48px; margin-bottom: 10px; }
    .status-badge { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="update-icon">📋</div>
      <h1>Order Status Updated</h1>
      <p>Order {{orderId}} status has been changed</p>
    </div>
    <div class="content">
      <div class="status-update">
        <h3>📊 Status Change:</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Previous Status:</strong> <span style="color: #6c757d;">{{oldStatus}}</span></p>
        <p><strong>New Status:</strong> <span class="status-badge">{{newStatus}}</span></p>
        <p><strong>Update Date:</strong> {{updateDate}}</p>
      </div>

      <div class="order-info">
        <h3>📋 Order Information:</h3>
        <p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Amount:</strong> {{currency}} {{totalAmount}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
      </div>
      
      <a href="{{websiteUrl}}/admin/orders" class="btn">View All Orders</a>
    </div>
    <div class="footer">
      <p>{{appName}} Admin Notification System</p>
      <p>This status update notification was sent automatically</p>
    </div>
  </div>
</body>
</html>`,
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
{{#if username}}- Username: {{username}}{{/if}}

View All Orders: {{websiteUrl}}/admin/orders

---
{{appName}} Admin Notification System
This status update notification was sent automatically`,
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
          "currentYear",
        ],
      },
    ];

    // Create templates if they don't exist
    for (const templateData of defaultTemplates) {
      const existingTemplate = await EmailTemplate.findOne({
        type: templateData.type,
      });
      if (!existingTemplate) {
        await EmailTemplate.create(templateData);
      }
    }

    res
      .status(200)
      .json({ message: "Default email templates initialized successfully" });
  } catch (error) {
    console.error("Error initializing default templates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  initializeDefaultTemplates,
};
