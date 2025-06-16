#!/usr/bin/env node

/**
 * Email Fix and Diagnostic Script for XenoNepal
 * This script will diagnose and attempt to fix email issues
 */

require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

class EmailFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      type === "error"
        ? "❌"
        : type === "warning"
        ? "⚠️"
        : type === "success"
        ? "✅"
        : "🔍";
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkEnvironmentVariables() {
    this.log("Checking environment variables...");

    const requiredVars = [
      "EMAIL_USER",
      "EMAIL_PASSWORD",
      "EMAIL_FROM_NAME",
      "SUPPORT_EMAIL",
    ];
    const missing = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.issues.push(`Missing environment variables: ${missing.join(", ")}`);
      this.log(`Missing environment variables: ${missing.join(", ")}`, "error");
      return false;
    }

    // Check Gmail App Password format
    const password = process.env.EMAIL_PASSWORD;
    if (password && password.length !== 16) {
      this.issues.push(
        `Gmail App Password should be 16 characters, got ${password.length}`
      );
      this.log(
        `Gmail App Password should be 16 characters, got ${password.length}`,
        "warning"
      );
    }

    this.log("Environment variables check passed", "success");
    return true;
  }

  async checkGmailAppPassword() {
    this.log("Checking Gmail App Password setup...");

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser.includes("@gmail.com")) {
      this.issues.push("Email user is not a Gmail address");
      this.log("Email user is not a Gmail address", "error");
      return false;
    }

    if (!emailPassword || emailPassword.length !== 16) {
      this.issues.push("Invalid Gmail App Password format");
      this.log("Invalid Gmail App Password format", "error");
      this.log("Please follow these steps:", "info");
      this.log("1. Enable 2-Factor Authentication on Gmail", "info");
      this.log("2. Go to https://myaccount.google.com/apppasswords", "info");
      this.log("3. Generate a 16-character App Password", "info");
      this.log("4. Update EMAIL_PASSWORD in .env file", "info");
      return false;
    }

    this.log("Gmail App Password format check passed", "success");
    return true;
  }

  async testEmailConnection() {
    this.log("Testing email connection...");

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: "SSLv3",
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
      });

      // Test connection with timeout
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout after 30 seconds")),
            30000
          )
        ),
      ]);

      this.log("Email connection test passed", "success");
      return transporter;
    } catch (error) {
      this.issues.push(`Email connection failed: ${error.message}`);
      this.log(`Email connection failed: ${error.message}`, "error");

      if (error.code === "EAUTH") {
        this.log("Authentication error - check Gmail App Password", "error");
      } else if (error.message.includes("timeout")) {
        this.log("Connection timeout - check network/firewall", "error");
      }

      return null;
    }
  }

  async sendTestEmail(transporter) {
    this.log("Sending test email...");

    try {
      const testEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

      const result = await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to: testEmail,
        subject: "🔧 Email Fix Test - XenoNepal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50; text-align: center;">✅ Email Service Fixed!</h2>
            <p>This test email confirms that your XenoNepal email service is working correctly.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>🔧 Fixed Issues:</h3>
              <ul>
                ${this.fixes.map((fix) => `<li>${fix}</li>`).join("")}
              </ul>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>📊 Test Results:</h3>
              <ul>
                <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                <li><strong>From:</strong> ${process.env.EMAIL_FROM_NAME} &lt;${
          process.env.EMAIL_USER
        }&gt;</li>
                <li><strong>Service:</strong> Gmail SMTP</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">
              Your email service is now ready for production! 🎉
            </p>
          </div>
        `,
        text: `
Email Service Fixed!

This test email confirms that your XenoNepal email service is working correctly.

Fixed Issues:
${this.fixes.map((fix) => `- ${fix}`).join("\n")}

Test Time: ${new Date().toISOString()}
From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>
Service: Gmail SMTP

Your email service is now ready for production!
        `,
      });

      this.log(`Test email sent successfully to ${testEmail}`, "success");
      this.log(`Message ID: ${result.messageId}`, "info");
      return true;
    } catch (error) {
      this.issues.push(`Test email failed: ${error.message}`);
      this.log(`Test email failed: ${error.message}`, "error");
      return false;
    }
  }

  async fixNodmailerImports() {
    this.log("Checking and fixing nodemailer imports...");

    const files = ["src/email/emailService.js", "test-email.js"];

    let fixed = false;

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Fix createTransporter -> createTransport
        content = content.replace(
          /nodemailer\.createTransporter/g,
          "nodemailer.createTransport"
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.fixes.push(`Fixed nodemailer import in ${file}`);
          this.log(`Fixed nodemailer import in ${file}`, "success");
          fixed = true;
        }
      }
    }

    if (!fixed) {
      this.log("No nodemailer import fixes needed", "info");
    }

    return fixed;
  }

  async generateSummaryReport() {
    this.log("\n" + "=".repeat(50));
    this.log("EMAIL DIAGNOSTIC SUMMARY REPORT", "info");
    this.log("=".repeat(50));

    if (this.issues.length === 0) {
      this.log(
        "🎉 No issues found! Email service is working correctly.",
        "success"
      );
    } else {
      this.log("❌ Issues found:", "error");
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, "error");
      });
    }

    if (this.fixes.length > 0) {
      this.log("\n✅ Fixes applied:", "success");
      this.fixes.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix}`, "success");
      });
    }

    this.log("\n📚 Next Steps:", "info");
    if (this.issues.length === 0) {
      this.log("- Your email service is ready for production", "info");
      this.log("- Test order emails by placing a test order", "info");
      this.log("- Monitor logs with: npm run logs", "info");
    } else {
      this.log("- Fix the issues listed above", "info");
      this.log("- Run this script again to verify fixes", "info");
      this.log("- Check EMAIL_TROUBLESHOOTING.md for detailed help", "info");
    }
  }

  async run() {
    this.log("🔧 Starting XenoNepal Email Diagnostic and Fix Tool\n");

    // Step 1: Fix code issues
    await this.fixNodmailerImports();

    // Step 2: Check environment
    const envOk = await this.checkEnvironmentVariables();
    if (!envOk) {
      await this.generateSummaryReport();
      return;
    }

    // Step 3: Check Gmail setup
    const gmailOk = await this.checkGmailAppPassword();
    if (!gmailOk) {
      await this.generateSummaryReport();
      return;
    }

    // Step 4: Test connection
    const transporter = await this.testEmailConnection();
    if (!transporter) {
      await this.generateSummaryReport();
      return;
    }

    // Step 5: Send test email
    const emailOk = await this.sendTestEmail(transporter);
    if (emailOk) {
      this.fixes.push("Email service tested and working correctly");
    }

    // Generate final report
    await this.generateSummaryReport();
  }
}

// Run the email fixer
const fixer = new EmailFixer();
fixer.run().catch(console.error);
