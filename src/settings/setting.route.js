const express = require("express");
const router = express.Router();
const {
  postSettings,
  getSettings,
  getPublicSettings,
  updateSettings,
  updateSettingSection,
  initializeSettings,
  testEmail,
} = require("./setting.controller");

// Route to initialize default settings
router.post("/initialize", initializeSettings);

// Route to create settings
router.post("/create-settings", postSettings);

// Route to get all settings (admin only)
router.get("/", getSettings);

// Route to get public settings (for frontend)
router.get("/public", getPublicSettings);

// Route to update settings
router.put("/edit/:id", updateSettings);

// Route to update specific setting section
router.put("/section/:section", updateSettingSection);

// Route to test email functionality
router.post("/test-email", testEmail);

module.exports = router;
