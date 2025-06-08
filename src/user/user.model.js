const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // required: function () {
    //   return !this.googleId; // Password required only if not Google user
    // },
    required: true,
    trim: true,
    minlength: 6,
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values
  },
  photoURL: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  phone: {
    type: String,
    default: "",
  },

  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
userSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    this.set({ updatedAt: Date.now() });
    next();
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
