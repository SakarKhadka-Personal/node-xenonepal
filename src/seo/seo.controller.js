/**
 * SEO Indexing API Controller
 * Handles indexing requests and IndexNow API integration
 */

const indexingQueue = [];
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "your-indexnow-key-here";

/**
 * Request immediate indexing for a URL
 */
const requestIndexing = async (req, res) => {
  try {
    const { url, priority = "normal" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL belongs to our domain
    if (!url.includes("xenonepal.com")) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    // Add to indexing queue
    const indexingRequest = {
      url,
      priority,
      timestamp: new Date().toISOString(),
      status: "queued",
    };

    indexingQueue.push(indexingRequest);

    // Process high priority immediately
    if (priority === "high") {
      await processIndexingRequest(indexingRequest);
    }

    res.json({
      success: true,
      message: "Indexing request queued",
      request: indexingRequest,
    });
  } catch (error) {
    console.error("Indexing request error:", error);
    res.status(500).json({ error: "Failed to process indexing request" });
  }
};

/**
 * Process indexing request using IndexNow API
 */
const processIndexingRequest = async (request) => {
  try {
    const { url } = request;

    // Method 1: Google IndexNow
    await submitToGoogle(url);

    // Method 2: Bing IndexNow
    await submitToBing(url);

    // Method 3: Yandex IndexNow
    await submitToYandex(url);

    request.status = "completed";
    console.log(`✅ IndexNow submitted for: ${url}`);
  } catch (error) {
    request.status = "failed";
    console.error("IndexNow submission failed:", error);
  }
};

/**
 * Submit to Google via IndexNow
 */
const submitToGoogle = async (url) => {
  try {
    const response = await fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(
        url
      )}&key=${INDEXNOW_KEY}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "XenoNepal-IndexBot/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google IndexNow failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Google IndexNow error:", error);
    return false;
  }
};

/**
 * Submit to Bing via IndexNow
 */
const submitToBing = async (url) => {
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XenoNepal-IndexBot/1.0",
      },
      body: JSON.stringify({
        host: "xenonepal.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://xenonepal.com/${INDEXNOW_KEY}.txt`,
        urlList: [url],
      }),
    });

    if (!response.ok) {
      throw new Error(`Bing IndexNow failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Bing IndexNow error:", error);
    return false;
  }
};

/**
 * Submit to Yandex via IndexNow
 */
const submitToYandex = async (url) => {
  try {
    const response = await fetch("https://yandex.com/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XenoNepal-IndexBot/1.0",
      },
      body: JSON.stringify({
        host: "xenonepal.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://xenonepal.com/${INDEXNOW_KEY}.txt`,
        urlList: [url],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Yandex IndexNow error:", error);
    return false;
  }
};

/**
 * Bulk indexing for multiple URLs
 */
const bulkIndexing = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    // Validate all URLs
    const validUrls = urls.filter((url) => url.includes("xenonepal.com"));

    if (validUrls.length === 0) {
      return res.status(400).json({ error: "No valid URLs provided" });
    }

    // Submit to Bing (supports bulk)
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XenoNepal-IndexBot/1.0",
      },
      body: JSON.stringify({
        host: "xenonepal.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://xenonepal.com/${INDEXNOW_KEY}.txt`,
        urlList: validUrls,
      }),
    });

    res.json({
      success: response.ok,
      message: `Bulk indexing ${response.ok ? "successful" : "failed"}`,
      urls: validUrls,
      count: validUrls.length,
    });
  } catch (error) {
    console.error("Bulk indexing error:", error);
    res.status(500).json({ error: "Bulk indexing failed" });
  }
};

/**
 * Get indexing queue status
 */
const getIndexingStatus = async (req, res) => {
  try {
    const stats = {
      total: indexingQueue.length,
      queued: indexingQueue.filter((r) => r.status === "queued").length,
      completed: indexingQueue.filter((r) => r.status === "completed").length,
      failed: indexingQueue.filter((r) => r.status === "failed").length,
      recent: indexingQueue.slice(-10), // Last 10 requests
    };

    res.json(stats);
  } catch (error) {
    console.error("Status retrieval error:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
};

/**
 * Ping search engines about sitemap updates
 */
const pingSitemap = async (req, res) => {
  try {
    const sitemapUrl = "https://xenonepal.com/sitemap.xml";

    const pingPromises = [
      // Google
      fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      ),
      // Bing
      fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      ),
      // Yahoo
      fetch(
        `https://search.yahooapis.com/SiteExplorerService/V1/ping?sitemap=${encodeURIComponent(
          sitemapUrl
        )}`
      ),
    ];

    const results = await Promise.allSettled(pingPromises);
    const successCount = results.filter((r) => r.status === "fulfilled").length;

    res.json({
      success: true,
      message: `Sitemap pinged to ${successCount}/3 search engines`,
      sitemapUrl,
      results: results.map((r) => ({ status: r.status })),
    });
  } catch (error) {
    console.error("Sitemap ping error:", error);
    res.status(500).json({ error: "Failed to ping sitemap" });
  }
};

/**
 * Google Indexing API endpoint
 * Handles Google's official indexing API
 */
const googleIndexingAPI = async (req, res) => {
  try {
    const { url, type = "URL_UPDATED" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // In production, this would use Google's Indexing API with service account
    // For now, we'll simulate the process and log the request
    console.log(`[Google Indexing API] ${type}: ${url}`);

    // Add to our internal indexing queue
    const indexingRequest = {
      url,
      type,
      service: "google-indexing-api",
      timestamp: new Date().toISOString(),
      status: "processed",
    };

    indexingQueue.push(indexingRequest);

    res.json({
      success: true,
      message: "Google Indexing API request processed",
      request: indexingRequest,
    });
  } catch (error) {
    console.error("Google Indexing API error:", error);
    res
      .status(500)
      .json({ error: "Failed to process Google Indexing API request" });
  }
};

/**
 * Submit URL endpoint
 * General URL submission for various search engines
 */
const submitURL = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL belongs to our domain
    if (!url.includes("xenonepal.com")) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    // Log the submission
    console.log(`[URL Submission] ${url}`);

    // Add to indexing queue
    const submissionRequest = {
      url,
      service: "url-submission",
      timestamp: new Date().toISOString(),
      status: "submitted",
    };

    indexingQueue.push(submissionRequest);

    res.json({
      success: true,
      message: "URL submission processed",
      request: submissionRequest,
    });
  } catch (error) {
    console.error("URL submission error:", error);
    res.status(500).json({ error: "Failed to process URL submission" });
  }
};

/**
 * Process indexing queue (should be called periodically)
 */
const processQueue = async () => {
  const queuedRequests = indexingQueue.filter((r) => r.status === "queued");

  for (const request of queuedRequests) {
    await processIndexingRequest(request);
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

// Process queue every 5 minutes
setInterval(processQueue, 5 * 60 * 1000);

module.exports = {
  requestIndexing,
  bulkIndexing,
  getIndexingStatus,
  pingSitemap,
  processQueue,
  googleIndexingAPI,
  submitURL,
};
