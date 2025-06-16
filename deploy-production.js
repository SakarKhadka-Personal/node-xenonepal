#!/usr/bin/env node

/**
 * Production Deployment Script for XenoNepal
 * This script helps deploy the application with proper environment setup
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting XenoNepal Production Deployment...\n");

// Check if required files exist
const requiredFiles = ["package.json", "index.js", "ecosystem.config.js"];

console.log("📋 Checking required files...");
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Found: ${file}`);
}

// Check environment variables
console.log("\n🔧 Checking environment variables...");
const requiredEnvVars = [
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "EMAIL_FROM_NAME",
  "SUPPORT_EMAIL",
];

const missingVars = [];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    console.log(
      `✅ ${varName}: ${
        varName === "EMAIL_PASSWORD" ? "***hidden***" : process.env[varName]
      }`
    );
  }
}

if (missingVars.length > 0) {
  console.log("\n⚠️  Missing environment variables:");
  missingVars.forEach((varName) => {
    console.log(`❌ ${varName}`);
  });
  console.log(
    "\n📝 These will be loaded from ecosystem.config.js or .env file"
  );
}

// Test email configuration
console.log("\n📧 Testing email configuration...");
try {
  const nodemailer = require("nodemailer");

  const emailUser = process.env.EMAIL_USER || "xenonepal@gmail.com";
  const emailPassword = process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt";

  console.log(`Email User: ${emailUser}`);
  console.log(
    `Email Password: ${emailPassword ? "***provided***" : "***missing***"}`
  );

  if (emailPassword.length < 10) {
    console.log(
      "⚠️  Email password seems short for Gmail App Password (should be 16 chars)"
    );
  }
} catch (error) {
  console.log("⚠️  Could not test email configuration:", error.message);
}

// Deploy with PM2
console.log("\n🚀 Deploying with PM2...");

try {
  // Stop existing process
  console.log("🛑 Stopping existing process...");
  try {
    execSync("pm2 stop xenonepal-server", { stdio: "inherit" });
  } catch (e) {
    console.log("No existing process to stop");
  }

  // Delete existing process
  console.log("🗑️  Deleting existing process...");
  try {
    execSync("pm2 delete xenonepal-server", { stdio: "inherit" });
  } catch (e) {
    console.log("No existing process to delete");
  }

  // Start new process in production mode
  console.log("▶️  Starting production process...");
  execSync("pm2 start ecosystem.config.js --env production", {
    stdio: "inherit",
  });

  // Save PM2 configuration
  console.log("💾 Saving PM2 configuration...");
  execSync("pm2 save", { stdio: "inherit" });

  // Show status
  console.log("\n📊 Process Status:");
  execSync("pm2 status", { stdio: "inherit" });

  console.log("\n✅ Production deployment completed successfully!");
  console.log("\n📝 Useful commands:");
  console.log("  pm2 logs xenonepal-server  - View logs");
  console.log("  pm2 status                 - Check status");
  console.log("  pm2 restart xenonepal-server - Restart app");
  console.log("  pm2 stop xenonepal-server  - Stop app");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
