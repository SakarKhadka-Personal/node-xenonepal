#!/usr/bin/env node

/**
 * Email Test Script for XenoNepal
 * This script tests the email configuration and sends a test email
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmailConfiguration() {
  console.log("🧪 Testing Email Configuration for XenoNepal\n");

  // Load email settings
  const emailSettings = {
    emailUser: process.env.EMAIL_USER || "xenonepal@gmail.com",
    emailPassword: process.env.EMAIL_PASSWORD || "kjjphtcoduqslwgt",
    emailFromName: process.env.EMAIL_FROM_NAME || "XenoNepal",
    supportEmail: process.env.SUPPORT_EMAIL || "support@xenonepal.com",
  };

  console.log("📧 Email Configuration:");
  console.log(`  User: ${emailSettings.emailUser}`);
  console.log(`  From Name: ${emailSettings.emailFromName}`);
  console.log(`  Support Email: ${emailSettings.supportEmail}`);
  console.log(
    `  Password: ${
      emailSettings.emailPassword ? "***provided***" : "***missing***"
    }`
  );
  console.log(
    `  Password Length: ${
      emailSettings.emailPassword ? emailSettings.emailPassword.length : 0
    } chars`
  );

  if (
    emailSettings.emailPassword &&
    emailSettings.emailPassword.length !== 16
  ) {
    console.log("⚠️  Gmail App Passwords are typically 16 characters long");
  }

  console.log("\n🔧 Creating Email Transporter...");

  try {
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: emailSettings.emailUser,
        pass: emailSettings.emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
    });

    console.log("✅ Transporter created successfully");

    console.log("\n🔍 Verifying SMTP Connection...");
    await transporter.verify();
    console.log("✅ SMTP Connection verified successfully!");

    // Send test email
    const testEmail = process.argv[2] || emailSettings.supportEmail;
    console.log(`\n📤 Sending test email to: ${testEmail}`);

    const mailOptions = {
      from: `${emailSettings.emailFromName} <${emailSettings.emailUser}>`,
      to: testEmail,
      subject: "🧪 Test Email from XenoNepal Production Server",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">🎉 Email Test Successful!</h2>
          <p>This is a test email from your XenoNepal production server.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📊 Server Information:</h3>
            <ul>
              <li><strong>Environment:</strong> ${
                process.env.NODE_ENV || "Unknown"
              }</li>
              <li><strong>Email Service:</strong> Gmail SMTP</li>
              <li><strong>From:</strong> ${emailSettings.emailFromName} &lt;${
        emailSettings.emailUser
      }&gt;</li>
              <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you received this email, your email configuration is working correctly! 🎉
          </p>
        </div>
      `,
      text: `
        🎉 Email Test Successful!
        
        This is a test email from your XenoNepal production server.
        
        Server Information:
        - Environment: ${process.env.NODE_ENV || "Unknown"}
        - Email Service: Gmail SMTP  
        - From: ${emailSettings.emailFromName} <${emailSettings.emailUser}>
        - Test Time: ${new Date().toISOString()}
        
        If you received this email, your email configuration is working correctly! 🎉
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Test email sent successfully!");
    console.log("📋 Email Details:");
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log(`  Accepted: ${info.accepted}`);
    console.log(`  Rejected: ${info.rejected}`);

    console.log("\n🎉 Email configuration test completed successfully!");
  } catch (error) {
    console.error("\n❌ Email test failed:");
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);

    if (error.code === "EAUTH") {
      console.error("\n🔑 Authentication Error Solutions:");
      console.error(
        "1. Make sure 2-Factor Authentication is enabled on your Gmail account"
      );
      console.error(
        "2. Generate an App Password: https://myaccount.google.com/apppasswords"
      );
      console.error(
        "3. Use the 16-character App Password, not your regular Gmail password"
      );
      console.error(
        "4. Make sure the EMAIL_USER and EMAIL_PASSWORD environment variables are correct"
      );
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error("\n🌐 Network Error Solutions:");
      console.error("1. Check your internet connection");
      console.error("2. Verify firewall/proxy settings");
      console.error(
        "3. Make sure Gmail SMTP (smtp.gmail.com:587) is accessible"
      );
    }

    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailConfiguration().catch(console.error);
}
