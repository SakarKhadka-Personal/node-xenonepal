const express = require("express");
const {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  initializeDefaultTemplates,
} = require("./emailTemplate.controller");

const router = express.Router();

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

module.exports = router;
