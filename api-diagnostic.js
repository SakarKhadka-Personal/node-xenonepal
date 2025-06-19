/**
 * API Diagnostic Tool
 *
 * This script tests API endpoints to help diagnose issues with:
 * 1. Product API endpoints
 * 2. Indexing and sitemap pings
 */

const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// Configuration
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://xenonepal.com/api"
    : "http://localhost:5000/api";

async function testProductsAPI() {
  console.log("=== Testing Products API ===");
  console.log(`Using base URL: ${BASE_URL}`);

  // Test GET /products endpoint
  try {
    console.log("\nTesting GET /products...");
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    console.log(`✓ Status: ${response.status}`);
    console.log(`✓ Products found: ${response.data.products?.length || 0}`);

    if (response.data.products?.length > 0) {
      const sample = response.data.products[0];
      console.log("\nSample product:");
      console.log(`  - ID: ${sample._id}`);
      console.log(`  - Title: ${sample.title}`);
      console.log(`  - Category: ${sample.category}`);
      console.log(`  - Base Price: ${sample.basePrice}`);
      console.log(
        `  - Product Quantities: ${sample.productQuantity?.length || 0}`
      );
    }
  } catch (error) {
    console.error("❌ Failed to fetch products:", error.message);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data:`, error.response.data);
    }
  }

  // Test product model validation
  try {
    console.log("\nTesting product validation...");

    // Create an incomplete product to test validation
    const incompleteProduct = {
      title: "Test Product",
      // Missing required fields to test validation
    };

    console.log("Attempting to create an incomplete product...");
    await axios.post(`${BASE_URL}/products`, incompleteProduct);

    // Should not reach here as validation should fail
    console.error("❌ Validation did not fail as expected");
  } catch (error) {
    if (
      error.response &&
      error.response.status === 400 &&
      error.response.data.message === "Validation Error"
    ) {
      console.log("✓ Validation working correctly");
      console.log("  Validation errors:", error.response.data.errors);
    } else {
      console.error(
        "❌ Unexpected error during validation test:",
        error.message
      );
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data:`, error.response.data);
      }
    }
  }
}

async function testSitemapPing() {
  console.log("\n=== Testing Sitemap Ping ===");

  try {
    console.log("Pinging sitemap...");
    const response = await axios.post(`${BASE_URL}/seo/ping-sitemap`);

    console.log(`✓ Status: ${response.status}`);
    console.log(`✓ Message: ${response.data.message}`);
    console.log("Ping results:", response.data.results);
  } catch (error) {
    console.error("❌ Failed to ping sitemap:", error.message);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data:`, error.response.data);
    }
  }
}

// Run the tests
async function runTests() {
  try {
    await testProductsAPI();
    await testSitemapPing();

    console.log("\n=== All tests completed ===");
  } catch (error) {
    console.error("Tests failed with error:", error);
  }
}

runTests();
