const Setting = require("./setting.model");
const EmailService = require("../email/emailService");

// Create email service instance
const emailService = new EmailService();

// Post a Settings
const postSettings = async (req, res) => {
  try {
    // Check if settings already exist
    const existingSettings = await Setting.findOne();
    if (existingSettings) {
      return res.status(400).json({ message: "Settings already exist" });
    }
    // Create new settings
    const newSettings = new Setting({ ...req.body });
    await newSettings.save();

    res.status(201).json(newSettings);
  } catch (error) {
    console.error("Error creating settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Settings
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Public Settings (for frontend without sensitive data)
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne().select(
      "-emailSettings.emailPassword -paymentSettings -integrations.recaptcha.secretKey -integrations.telegram.botToken"
    );
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Settings
const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSettings = await Setting.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedSettings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Specific Setting Section
const updateSettingSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = {};

    // Validate section
    const validSections = [
      "emailSettings",
      "domainSettings",
      "paymentSettings",
      "integrations",
      "siteConfig",
    ];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid settings section" });
    }

    updateData[section] = req.body;
    const settings = await Setting.findOneAndUpdate({}, updateData, {
      new: true,
      runValidators: true,
      upsert: true,
    });

    // If updating email settings, reinitialize email service
    if (section === "emailSettings") {
      await emailService.reinitializeTransporter();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error updating settings section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Initialize default settings if none exist
const initializeSettings = async (req, res) => {
  try {
    const existingSettings = await Setting.findOne();
    if (existingSettings) {
      return res.status(200).json({
        message: "Settings already initialized",
        settings: existingSettings,
      });
    }

    const defaultSettings = new Setting({
      appName: "XenoNepal",
      appCurrency: "NPR",
      seoTitle: "XenoNepal - Gaming Top-Ups & Subscriptions in Nepal",
      seoDescription:
        "XenoNepal is Nepal's premier destination for gaming top-ups, digital subscriptions, and gift cards.",
      siteName: "XenoNepal",
      domainSettings: {
        productionDomain: "xenonepal.com",
        apiBaseUrl: "https://xenonepal.com/api",
        enableHttps: true,
      },
      emailSettings: {
        emailFromName: "XenoNepal",
        supportEmail: "support@xenonepal.com",
        enableEmailNotifications: true,
      },
      siteConfig: {
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true,
        maxOrdersPerDay: 50,
        autoApproveOrders: false,
      },
    });

    await defaultSettings.save();
    res.status(201).json({
      message: "Settings initialized successfully",
      settings: defaultSettings,
    });
  } catch (error) {
    console.error("Error initializing settings:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      details: error,
    });
  }
};

// Test email functionality
const testEmail = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Email address is required" });
    }

    // Try to send a test email
    const result = await emailService.sendEmail({
      to,
      templateType: "test_email",
      variables: {
        testMessage: "This is a test email from XenoNepal settings panel.",
      },
    });

    if (result) {
      res.status(200).json({
        message: "Test email sent successfully",
        success: true,
      });
    } else {
      res.status(500).json({
        message: "Failed to send test email",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  postSettings,
  getSettings,
  getPublicSettings,
  updateSettings,
  updateSettingSection,
  initializeSettings,
  testEmail,
};
