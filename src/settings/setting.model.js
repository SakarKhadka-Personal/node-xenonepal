const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    trim: true,
  },
  appCurrency: {
    type: String,
    required: true,
    trim: true,
  },
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
