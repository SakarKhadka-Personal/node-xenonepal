const Setting = require("./setting.model");

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

// Update Settings
const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSettings = await Setting.findByIdAndUpdate(id, req.body, {
      new: true,
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

module.exports = {
  postSettings,
  getSettings,
  updateSettings,
};
