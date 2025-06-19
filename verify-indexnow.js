/**
 * IndexNow Key Verification Script
 *
 * This script verifies that:
 * 1. The IndexNow key is properly set in the environment
 * 2. The key file exists at the expected location
 * 3. The key file is accessible from the web
 */

const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// Get the IndexNow key from environment or use default
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "indexnow-key";

async function verifyIndexNowSetup() {
  console.log("=== IndexNow Key Verification ===");

  // Check if key is set in environment
  if (INDEXNOW_KEY === "indexnow-key") {
    console.error("❌ IndexNow key not found in environment variables");
    console.log("   Please set INDEXNOW_KEY in your .env file");
  } else {
    console.log(
      `✓ IndexNow key found: ${INDEXNOW_KEY.substring(
        0,
        4
      )}...${INDEXNOW_KEY.substring(INDEXNOW_KEY.length - 4)}`
    );
  }

  // Verify the key file is accessible
  try {
    const keyUrl = `https://xenonepal.com/${INDEXNOW_KEY}.txt`;
    console.log(`Checking key file at: ${keyUrl}`);

    const response = await axios.get(keyUrl, { timeout: 5000 });

    if (response.status === 200) {
      console.log(`✓ Key file accessible: ${keyUrl}`);

      // Verify content matches
      const content = response.data.trim();
      if (content === INDEXNOW_KEY) {
        console.log("✓ Key file content matches the environment key");
      } else {
        console.error("❌ Key file content does not match the environment key");
        console.log(`   File content: ${content}`);
        console.log(`   Expected: ${INDEXNOW_KEY}`);
      }
    } else {
      console.error(
        `❌ Key file returned unexpected status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("❌ Failed to access key file:", error.message);
    console.log("   Make sure the key file exists in the root of your website");
    console.log(
      `   Expected file: ${INDEXNOW_KEY}.txt containing only the key value`
    );
  }

  // Check for file in public folder
  try {
    console.log("\nChecking if indexnow-key.txt exists in public folder...");
    const publicKeyUrl = "https://xenonepal.com/indexnow-key.txt";
    const response = await axios.get(publicKeyUrl, { timeout: 5000 });

    if (response.status === 200) {
      console.log("✓ Found indexnow-key.txt in public folder");
      console.log(`   Content: ${response.data.trim()}`);

      if (response.data.trim() !== INDEXNOW_KEY) {
        console.log("⚠️ Warning: Content doesn't match environment key");
      }
    }
  } catch (error) {
    console.log(
      "ℹ️ No indexnow-key.txt found in public folder (this is optional)"
    );
  }

  console.log("\nVerification complete");
}

// Run the verification
verifyIndexNowSetup().catch((error) => {
  console.error("Verification failed with error:", error);
});
