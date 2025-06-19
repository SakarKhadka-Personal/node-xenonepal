// Quick test script to verify email template
const axios = require("axios");

async function testEmailAPI() {
  try {
    // Test the custom email endpoint
    const response = await axios.post(
      "http://localhost:5000/api/email/send-custom",
      {
        recipients: [], // Empty array to test with sendToAll
        sendToAll: false, // Will use specific test email
        subject: "Template Test - Beautiful Email Design",
        message:
          "This is a test message to verify that the beautiful HTML template is working correctly.\n\nThe email should have:\n- Gradient header with gaming theme\n- Styled message box\n- Feature grid showing gaming services\n- Professional footer\n- Mobile-responsive design",
      },
      {
        headers: {
          adminkey: "xenonepal2025adminkey", // Admin key for authentication
        },
      }
    );

    console.log("✅ Email API Response:", response.data);
  } catch (error) {
    console.error("❌ Email API Error:", error.response?.data || error.message);
  }
}

// Wait 5 seconds then test
setTimeout(testEmailAPI, 5000);
