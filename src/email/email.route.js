const express = require("express");
const {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  initializeDefaultTemplates,
  getTemplateVariables,
  getTemplateVariablesSummary,
} = require("./emailTemplate.controller");
const emailService = require("./emailService");

const router = express.Router();

// Test HTML email endpoint
router.post("/test-html", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Email address is required" });
    }
    const result = await emailService.sendTestHtmlEmail(to);

    if (result) {
      res.status(200).json({
        message: "HTML test email sent successfully",
        success: true,
      });
    } else {
      res.status(500).json({
        message: "Failed to send HTML test email",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error sending HTML test email:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
});

// Initialize default templates (should be called once)
router.post("/templates/init", initializeDefaultTemplates);

// Get all email templates
router.get("/templates", getAllTemplates);

// Get single email template
router.get("/templates/:id", getTemplate);

// Create new email template
router.post("/templates", createTemplate);

// Update email template
router.put("/templates/:id", updateTemplate);

// Delete email template
router.delete("/templates/:id", deleteTemplate);

// Get template variables with documentation
router.get("/templates/:type/variables", getTemplateVariables);

// Get all template variables summary
router.get("/variables/summary", getTemplateVariablesSummary);

module.exports = router;
