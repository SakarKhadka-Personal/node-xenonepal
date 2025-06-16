#!/usr/bin/env node

/**
 * Quick Email Test - Simplified test for debugging
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

async function quickEmailTest() {
  console.log("🔍 Quick Email Test\n");

  const emailSettings = {
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
  };

  console.log("📧 Email Settings:");
  console.log(`  User: ${emailSettings.emailUser}`);
  console.log(`  Password exists: ${!!emailSettings.emailPassword}`);
  console.log(
    `  Password length: ${
      emailSettings.emailPassword ? emailSettings.emailPassword.length : 0
    }`
  );

  if (!emailSettings.emailUser || !emailSettings.emailPassword) {
    console.error("❌ Missing email credentials!");
    return;
  }

  try {
    console.log("\n🔧 Creating transporter...");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailSettings.emailUser,
        pass: emailSettings.emailPassword,
      },
      logger: true, // Enable debug logs
      debug: true, // Enable debug mode
    });

    console.log("✅ Transporter created");

    console.log("\n🔍 Testing connection...");

    // Add timeout to prevent hanging
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 10000)
    );

    await Promise.race([verifyPromise, timeoutPromise]);

    console.log("✅ Connection verified!");

    // Try sending a simple test email
    console.log("\n📤 Sending test email...");

    const result = await transporter.sendMail({
      from: emailSettings.emailUser,
      to: emailSettings.emailUser, // Send to self
      subject: "Quick Test Email",
      text: "This is a quick test email from XenoNepal server.",
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);
  } catch (error) {
    console.error("❌ Email test failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);

    if (error.code === "EAUTH") {
      console.error("\n🔑 Authentication Error Solutions:");
      console.error("1. Check if Gmail App Password is correct");
      console.error("2. Enable 2-Factor Authentication on Gmail");
      console.error(
        "3. Generate new App Password: https://myaccount.google.com/apppasswords"
      );
      console.error(
        "4. Make sure 'Less secure app access' is disabled (use App Password instead)"
      );
    } else if (
      error.code === "ENOTFOUND" ||
      error.message.includes("timeout")
    ) {
      console.error("\n🌐 Network Error Solutions:");
      console.error("1. Check internet connection");
      console.error("2. Check firewall settings");
      console.error("3. Try different network");
    }
  }
}

quickEmailTest().catch(console.error);
