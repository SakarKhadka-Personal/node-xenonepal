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

// Get template variables with detailed documentation
const getTemplateVariables = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ message: "Template type is required" });
    }

    const template = await EmailTemplate.findOne({ type, isActive: true });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Return detailed variable information
    const response = {
      templateType: template.type,
      availableVariables: template.availableVariables,
      variableDocumentation: template.variableDocumentation,
      lastUpdated: template.updatedAt,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching template variables:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all template types with their variable counts
const getTemplateVariablesSummary = async (req, res) => {
  try {
    const templates = await EmailTemplate.find(
      {},
      "type availableVariables variableDocumentation isActive updatedAt"
    );

    const summary = templates.map((template) => ({
      type: template.type,
      isActive: template.isActive,
      variableCount: template.availableVariables.length,
      hasDocumentation: !!template.variableDocumentation,
      categories: template.variableDocumentation?.categories
        ? Object.keys(template.variableDocumentation.categories)
        : [],
      lastUpdated: template.updatedAt,
    }));

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching template variables summary:", error);
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
        <p><strong>Total Amount:</strong> {{currency}} {{amount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
        <p><strong>Order Date:</strong> {{orderDate}}</p>
      </div>
      
      <div class="order-details" style="background-color: #e8f5e8; border-left: 4px solid #28a745;">
        <h3>Billing Information:</h3>
        <p><strong>Name:</strong> {{billingName}}</p>
        <p><strong>Email:</strong> {{billingEmail}}</p>
        <p><strong>Phone:</strong> {{billingPhone}}</p>
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
- Total Amount: {{currency}} {{amount}}
- Payment Method: {{paymentMethod}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}
- Order Date: {{orderDate}}

Billing Information:
- Name: {{billingName}}
- Email: {{billingEmail}}
- Phone: {{billingPhone}}

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
          "amount",
          "totalAmount",
          "currency",
          "paymentMethod",
          "billingName",
          "billingEmail",
          "billingPhone",
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
        <p><strong>Total Amount:</strong> {{currency}} {{amount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
        <p><strong>Delivered On:</strong> {{deliveryDate}}</p>
      </div>
      
      <div class="order-details" style="background-color: #e8f5e8; border-left: 4px solid #28a745;">
        <h3>Billing Information:</h3>
        <p><strong>Name:</strong> {{billingName}}</p>
        <p><strong>Email:</strong> {{billingEmail}}</p>
        <p><strong>Phone:</strong> {{billingPhone}}</p>
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
- Total Amount: {{currency}} {{amount}}
- Payment Method: {{paymentMethod}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}
- Delivered On: {{deliveryDate}}

Billing Information:
- Name: {{billingName}}
- Email: {{billingEmail}}
- Phone: {{billingPhone}}

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
          "amount",
          "totalAmount",
          "currency",
          "paymentMethod",
          "billingName",
          "billingEmail",
          "billingPhone",
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
        <p><strong>Total Amount:</strong> {{currency}} {{amount}}</p>
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
      
      <div class="customer-details" style="background-color: #e8f5e8; border-left: 4px solid #28a745;">
        <h3>💳 Billing Information:</h3>
        <p><strong>Billing Name:</strong> {{billingName}}</p>
        <p><strong>Billing Email:</strong> {{billingEmail}}</p>
        <p><strong>Billing Phone:</strong> {{billingPhone}}</p>
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
- Total Amount: {{currency}} {{amount}}
- Payment Method: {{paymentMethod}}
- Order Date: {{orderDate}}

👤 CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}

💳 BILLING INFORMATION:
- Billing Name: {{billingName}}
- Billing Email: {{billingEmail}}
- Billing Phone: {{billingPhone}}

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
          "amount",
          "totalAmount",
          "currency",
          "paymentMethod",
          "billingName",
          "billingEmail",
          "billingPhone",
          "playerID",
          "username",
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
      </div>      <div class="order-info">
        <h3>📋 Order Information:</h3>
        <p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Player ID:</strong> {{playerID}}</p>
        {{#if username}}<p><strong>Username:</strong> {{username}}</p>{{/if}}
      </div>
      
      <div class="order-info" style="background-color: #e8f5e8; border-left: 4px solid #28a745;">
        <h3>💳 Billing Information:</h3>
        <p><strong>Billing Name:</strong> {{billingName}}</p>
        <p><strong>Billing Email:</strong> {{billingEmail}}</p>
        <p><strong>Billing Phone:</strong> {{billingPhone}}</p>
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
- Amount: {{currency}} {{amount}}
- Payment Method: {{paymentMethod}}
- Player ID: {{playerID}}
{{#if username}}- Username: {{username}}{{/if}}

💳 BILLING INFORMATION:
- Billing Name: {{billingName}}
- Billing Email: {{billingEmail}}
- Billing Phone: {{billingPhone}}

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
          "amount",
          "totalAmount",
          "currency",
          "paymentMethod",
          "billingName",
          "billingEmail",
          "billingPhone",
          "playerID",
          "username",
          "updateDate",
          "appName",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "test_email",
        subject: "Test Email - {{appName}} Configuration Check",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .test-details { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .success-badge { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .feature-list li:before { content: "✅ "; color: #28a745; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Email System Test</h1>
      <p>{{appName}} Email Configuration Check</p>
      <span class="success-badge">HTML ENABLED</span>
    </div>
    <div class="content">
      <h2>Email Service Status: <span style="color: #28a745;">✅ Working</span></h2>
      <p>Congratulations! Your email service is properly configured and can send HTML emails.</p>
      
      <div class="test-details">
        <h3>📧 Test Details:</h3>
        <ul class="feature-list">
          <li><strong>HTML Rendering:</strong> Successful</li>
          <li><strong>CSS Styling:</strong> Applied</li>
          <li><strong>Template Variables:</strong> {{testMessage}}</li>
          <li><strong>Email Service:</strong> Operational</li>
          <li><strong>SMTP Configuration:</strong> Valid</li>
        </ul>
      </div>
      
      <h3>🎨 Visual Elements Test:</h3>
      <p>If you can see this content with proper formatting, colors, and styling, then your HTML email templates are working correctly!</p>
      
      <p style="color: #007bff; font-size: 18px; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <strong>HTML Email Support: CONFIRMED ✅</strong>
      </p>
      
      <p><strong>Test sent:</strong> {{currentYear}}<br>
      <strong>From:</strong> {{appName}} Email System<br>
      <strong>Support:</strong> {{supportEmail}}</p>
    </div>
    <div class="footer">
      <p>This test email confirms your {{appName}} email system is working properly.</p>
      <p>You can now customize your email templates with confidence!</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Email System Test - {{appName}}

Email Service Status: ✅ Working

Congratulations! Your email service is properly configured.

Test Details:
- HTML Rendering: If you see this plain text, HTML might not be supported by your email client
- Template Variables: {{testMessage}}
- Email Service: Operational
- SMTP Configuration: Valid

Test sent: {{currentYear}}
From: {{appName}} Email System
Support: {{supportEmail}}

This test email confirms your {{appName}} email system is working properly.

© {{currentYear}} {{appName}}. All rights reserved.`,
        availableVariables: [
          "testMessage",
          "appName",
          "supportEmail",
          "websiteUrl",
          "currentYear",
        ],
      },
      {
        type: "exclusive_coupon",
        subject:
          "🎉 Exclusive Coupon Just for You! - {{couponCode}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusive Coupon</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .coupon-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 3px dashed #fff; }
    .coupon-code { font-size: 28px; font-weight: bold; letter-spacing: 3px; background-color: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 5px; margin: 10px 0; }
    .discount-badge { font-size: 24px; background-color: #28a745; color: white; padding: 10px 15px; border-radius: 50px; display: inline-block; margin: 10px 0; }
    .coupon-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .gift-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gift-icon">🎁</div>
      <h1>Exclusive Coupon Just for You!</h1>
      <p>{{appName}} has something special for you, {{customerName}}!</p>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>We're excited to share this exclusive coupon created especially for you! This is your personal discount that can't be found anywhere else.</p>
      
      <div class="coupon-box">
        <h2>🎉 Your Exclusive Coupon</h2>
        <div class="coupon-code">{{couponCode}}</div>        <div class="discount-badge">
          {{discountDisplay}}
        </div>
        <p style="margin-top: 15px; font-size: 16px;">Use this code at checkout to get your exclusive discount!</p>
      </div>
      
      <div class="coupon-details">
        <h3>📋 Coupon Details:</h3>        <p><strong>Discount:</strong> {{discountText}}</p>
        <p><strong>Usage Limit:</strong> {{usagePerUser}} time(s) for you personally</p>
        <p><strong>Valid Until:</strong> {{expiryDate}}</p>
        <p><strong>Issued Date:</strong> {{issuedDate}}</p>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <strong>This coupon is exclusively yours!</strong><br>
        Don't miss out on this special offer - it's valid for a limited time only.
      </p>
      
      <a href="{{websiteUrl}}" class="btn">Shop Now & Use Your Coupon</a>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        <strong>How to use:</strong> Simply enter the coupon code <strong>{{couponCode}}</strong> during checkout to apply your exclusive discount.
      </p>
    </div>
    <div class="footer">
      <p>Thank you for being a valued member of {{appName}}!</p>
      <p>If you have any questions about your coupon, please contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `🎉 Exclusive Coupon Just for You! - {{couponCode}}

Dear {{customerName}},

We're excited to share this exclusive coupon created especially for you! This is your personal discount that can't be found anywhere else.

YOUR EXCLUSIVE COUPON: {{couponCode}}

Discount: {{discountDisplay}}

Coupon Details:
- Usage Limit: {{usagePerUser}} time(s) for you personally
- Valid Until: {{expiryDate}}
- Issued Date: {{issuedDate}}

This coupon is exclusively yours! Don't miss out on this special offer - it's valid for a limited time only.

How to use: Simply enter the coupon code {{couponCode}} during checkout to apply your exclusive discount.

Visit {{websiteUrl}} to shop now and use your coupon!

Thank you for being a valued member of {{appName}}!

If you have any questions about your coupon, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        availableVariables: [
          "customerName",
          "userEmail",
          "couponCode",
          "discountValue",
          "discountType",
          "maxDiscount",
          "discountDisplay",
          "discountText",
          "isPercentage",
          "expiryDate",
          "usageLimit",
          "usagePerUser",
          "issuedDate",
          "appName",
          "supportEmail",
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
  getTemplateVariables,
  getTemplateVariablesSummary,
};
