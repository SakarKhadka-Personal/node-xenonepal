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

// Update the active status of a template
const toggleTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Toggle the isActive status
    template.isActive = !template.isActive;
    await template.save();

    res.status(200).json({
      message: `Template ${
        template.isActive ? "enabled" : "disabled"
      } successfully`,
      template,
    });
  } catch (error) {
    console.error("Error toggling template status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get template status summary
const getTemplateStatusSummary = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().select(
      "type subject isActive"
    );

    // Group templates by category
    const groupedTemplates = {
      customer: templates.filter((t) =>
        [
          "order_completion",
          "order_delivered",
          "order_cancelled",
          "user_registration",
          "welcome",
          "exclusive_coupon",
        ].includes(t.type)
      ),
      admin: templates.filter((t) =>
        ["admin_new_order", "admin_order_status_update"].includes(t.type)
      ),
      other: templates.filter((t) => ["test_email"].includes(t.type)),
    };

    res.status(200).json({
      message: "Template status summary retrieved successfully",
      templates: groupedTemplates,
    });
  } catch (error) {
    console.error("Error getting template status summary:", error);
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
        type: "welcome",
        subject: "Welcome Back to {{appName}}!",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Back!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .benefits { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome Back!</h1>
      <p>We're glad to see you again at {{appName}}</p>
    </div>
    <div class="content">
      <p>Hello {{userName}},</p>
      <p>Welcome back to {{appName}}! We've missed you and are excited to have you back.</p>
      
      <div class="benefits">
        <h3>Your Gaming Benefits:</h3>
        <ul>
          <li>Easy access to game top-ups, subscriptions, and gift cards</li>
          <li>Secure payment methods and instant delivery</li>
          <li>XenoCoins rewards program - earn on every purchase</li>
          <li>Exclusive deals and promotions for registered users</li>
        </ul>
      </div>
      
      <p>Ready to enhance your gaming experience? Check out our latest offerings!</p>
      
      <div style="text-align: center;">
        <a href="{{websiteUrl}}" class="btn">Browse Gaming Services</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for choosing {{appName}}!</p>
      <p>If you have any questions, please contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Welcome Back to {{appName}}!

Hello {{userName}},

Welcome back to {{appName}}! We've missed you and are excited to have you back.

Your Gaming Benefits:
- Easy access to game top-ups, subscriptions, and gift cards
- Secure payment methods and instant delivery
- XenoCoins rewards program - earn on every purchase
- Exclusive deals and promotions for registered users

Ready to enhance your gaming experience? Check out our latest offerings!

Visit us at: {{websiteUrl}}

Thank you for choosing {{appName}}!
If you have any questions, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        isActive: true,
      },
      {
        type: "user_registration",
        subject: "Account Created Successfully - {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Created</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .next-steps { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4a90e2; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Created!</h1>
      <p>Welcome to {{appName}}</p>
    </div>
    <div class="content">
      <p>Hello {{userName}},</p>
      <p>Thank you for creating your account with {{appName}}! Your account has been successfully created and is ready to use.</p>
      
      <div class="next-steps">
        <h3>Here's what you can do next:</h3>
        <ul>
          <li>Browse our catalog of gaming products</li>
          <li>Top up your favorite games</li>
          <li>Purchase subscriptions at competitive prices</li>
          <li>Redeem gift cards for various platforms</li>
        </ul>
      </div>
      
      <p>We recommend verifying your email and completing your profile for a seamless experience.</p>
      
      <div style="text-align: center;">
        <a href="{{websiteUrl}}/profile" class="btn">Complete Your Profile</a>
      </div>
    </div>
    <div class="footer">
      <p>Welcome to the {{appName}} family!</p>
      <p>If you have any questions, please contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Account Created Successfully - {{appName}}

Hello {{userName}},

Thank you for creating your account with {{appName}}! Your account has been successfully created and is ready to use.

Here's what you can do next:
- Browse our catalog of gaming products
- Top up your favorite games
- Purchase subscriptions at competitive prices
- Redeem gift cards for various platforms

We recommend verifying your email and completing your profile for a seamless experience.

Complete your profile: {{websiteUrl}}/profile

Welcome to the {{appName}} family!
If you have any questions, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        isActive: true,
      },
      {
        type: "order_cancelled",
        subject: "Order Cancelled - {{orderId}} | {{appName}}",
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e66465 0%, #9198e5 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .message-box { background-color: #ffe8e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e66465; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    .btn { display: inline-block; background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Cancelled</h1>
      <p>Information about your cancelled order</p>
    </div>
    <div class="content">
      <p>Dear {{userName}},</p>
      <p>We're sorry to inform you that your order has been cancelled.</p>
        
      <div class="order-details">
        <h3>Cancelled Order Details:</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
        <p><strong>Cancelled On:</strong> {{cancellationDate}}</p>
      </div>
      
      <div class="message-box">
        <p>If this cancellation was unexpected or if you have any questions, please contact our support team immediately.</p>
        <p>We apologize for any inconvenience caused and appreciate your understanding.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{websiteUrl}}/contact" class="btn">Contact Support</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your understanding.</p>
      <p>If you have any questions, please contact us at {{supportEmail}}</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Order Cancelled - {{orderId}} | {{appName}}

Dear {{userName}},

We're sorry to inform you that your order has been cancelled.

Cancelled Order Details:
- Order ID: {{orderId}}
- Product: {{productName}}
- Quantity: {{quantity}}
- Amount: {{currency}} {{amount}}
- Cancelled On: {{cancellationDate}}

If this cancellation was unexpected or if you have any questions, please contact our support team immediately.

We apologize for any inconvenience caused and appreciate your understanding.

Contact Support: {{websiteUrl}}/contact

Thank you for your understanding.
If you have any questions, please contact us at {{supportEmail}}

© {{currentYear}} {{appName}}. All rights reserved.`,
        isActive: true,
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
  toggleTemplateStatus,
  getTemplateStatusSummary,
};
