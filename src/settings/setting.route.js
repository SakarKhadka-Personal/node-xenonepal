const express = require("express");
const router = express.Router();
const {
  postSettings,
  getSettings,
  updateSettings,
} = require("./setting.controller");

// Route to create settings
router.post("/create-settings", postSettings);

// Route to get settings
router.get("/", getSettings);

// Route to update settings
router.put("/edit/:id", updateSettings);

module.exports = router;
