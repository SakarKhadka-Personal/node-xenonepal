const mongoose = require("mongoose");
const emailService = require("./src/email/emailService");

// Test email functionality
async function testEmailSystem() {
  try {
    // Connect to database
    await mongoose.connect("mongodb://localhost:27017/aliensubs", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Test data
    const testUserEmail = "test@example.com"; // Replace with your email for testing

    const testOrderData = {
      userName: "John Doe",
      orderId: "XN123456",
      productName: "PUBG Mobile UC - 2000 + 600",
      quantity: 1,
      totalAmount: 1500,
      currency: "NPR",
      playerID: "123456789",
      username: "JohnGamer",
      createdAt: new Date(),
    };

    const testUserData = {
      name: "John Doe",
      email: testUserEmail,
    };

    console.log("\n=== Testing Email System ===");

    // Test 1: Welcome Email
    console.log("\n1. Testing Welcome Email...");
    const welcomeResult = await emailService.sendWelcomeEmail(
      testUserEmail,
      testUserData
    );
    console.log(
      "Welcome email result:",
      welcomeResult ? "✅ Success" : "❌ Failed"
    );

    // Test 2: Order Confirmation Email
    console.log("\n2. Testing Order Confirmation Email...");
    const orderResult = await emailService.sendOrderCompletionEmail(
      testUserEmail,
      testOrderData
    );
    console.log(
      "Order confirmation email result:",
      orderResult ? "✅ Success" : "❌ Failed"
    );

    // Test 3: Order Delivery Email
    console.log("\n3. Testing Order Delivery Email...");
    const deliveryResult = await emailService.sendOrderDeliveredEmail(
      testUserEmail,
      testOrderData
    );
    console.log(
      "Order delivery email result:",
      deliveryResult ? "✅ Success" : "❌ Failed"
    );

    console.log("\n=== Email System Test Complete ===");
    console.log("\nNotes:");
    console.log(
      "- If all tests show '❌ Failed', configure your email settings in .env"
    );
    console.log("- Update EMAIL_USER and EMAIL_PASSWORD in your .env file");
    console.log("- Replace 'test@example.com' with your actual email address");
    console.log(
      "- Email templates are stored in the database and can be customized via admin panel"
    );
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Only run test if called directly
if (require.main === module) {
  testEmailSystem();
}

module.exports = { testEmailSystem };
