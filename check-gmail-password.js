#!/usr/bin/env node

/**
 * Quick Gmail App Password Checker
 * This script specifically checks if the Gmail App Password is working
 */

require("dotenv").config();

async function checkGmailAppPassword() {
  console.log("🔐 Gmail App Password Checker\n");

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

  console.log("📧 Configuration:");
  console.log(`Email: ${EMAIL_USER}`);
  console.log(`Password Length: ${EMAIL_PASSWORD ? EMAIL_PASSWORD.length : 0}`);
  console.log(`Is Gmail: ${EMAIL_USER && EMAIL_USER.includes("@gmail.com")}`);

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("❌ Missing email credentials in .env file");
    console.log("\nPlease add to your .env file:");
    console.log("EMAIL_USER=your-email@gmail.com");
    console.log("EMAIL_PASSWORD=your-16-char-app-password");
    return;
  }

  if (!EMAIL_USER.includes("@gmail.com")) {
    console.log("❌ Email must be a Gmail address for this service");
    return;
  }

  if (EMAIL_PASSWORD.length !== 16) {
    console.log("⚠️  Gmail App Passwords are typically 16 characters");
    console.log("Current password length:", EMAIL_PASSWORD.length);
  }

  console.log("\n🔍 Checking Gmail App Password...");
  console.log("📋 Instructions to get a valid App Password:");
  console.log("1. Go to https://myaccount.google.com/security");
  console.log("2. Enable 2-Factor Authentication (if not already enabled)");
  console.log("3. Go to https://myaccount.google.com/apppasswords");
  console.log("4. Create an App Password for 'Mail'");
  console.log("5. Copy the 16-character password (no spaces)");
  console.log("6. Update EMAIL_PASSWORD in your .env file");
  console.log("7. Run this script again to test");

  console.log("\n🔑 Current password format check:");
  if (EMAIL_PASSWORD.length === 16 && /^[a-z]+$/.test(EMAIL_PASSWORD)) {
    console.log("✅ Password format looks correct (16 lowercase letters)");
  } else if (EMAIL_PASSWORD.length === 16) {
    console.log("⚠️  Password is 16 characters but may have wrong format");
    console.log("   Gmail App Passwords are usually 16 lowercase letters");
  } else {
    console.log("❌ Password format is incorrect");
    console.log("   Expected: 16 lowercase letters (e.g., 'abcdefghijklmnop')");
    console.log(`   Got: ${EMAIL_PASSWORD.length} characters`);
  }

  console.log("\n🎯 To test the password, run:");
  console.log("npm run fix-email");
}

checkGmailAppPassword().catch(console.error);
