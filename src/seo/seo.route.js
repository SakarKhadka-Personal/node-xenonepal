const express = require("express");
const router = express.Router();
const {
  requestIndexing,
  bulkIndexing,
  getIndexingStatus,
  pingSitemap,
  googleIndexingAPI,
  submitURL,
} = require("./seo.controller");

/**
 * SEO Indexing Routes
 */

// Request indexing for a single URL
router.post("/request-indexing", requestIndexing);

// Bulk indexing for multiple URLs
router.post("/bulk-indexing", bulkIndexing);

// Get indexing queue status
router.get("/status", getIndexingStatus);

// Ping sitemap to search engines
router.post("/ping-sitemap", pingSitemap);

// Google Indexing API
router.post("/google-indexing", googleIndexingAPI);

// Submit URL endpoint
router.post("/submit-url", submitURL);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SEO Indexing API",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
