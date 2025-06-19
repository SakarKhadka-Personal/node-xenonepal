/**
 * SEO Indexing API Controller
 * Handles indexing requests and IndexNow API integration
 */
const dotenv = require("dotenv");
dotenv.config();

const indexingQueue = [];
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "indexnow-key";

// Log key status at startup
console.log(
  `IndexNow key ${
    INDEXNOW_KEY === "indexnow-key"
      ? "NOT FOUND (using default)"
      : "loaded from environment"
  }`
);

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
    console.log(`Submitting to Google IndexNow: ${url}`);

    const indexNowUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(
      url
    )}&key=${INDEXNOW_KEY}`;
    console.log(`IndexNow URL: ${indexNowUrl}`);

    const response = await fetch(indexNowUrl, {
      method: "GET",
      headers: {
        "User-Agent": "XenoNepal-IndexBot/1.0",
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `Google IndexNow failed: ${response.status} - ${responseText}`
      );
      throw new Error(
        `Google IndexNow failed: ${response.status} - ${responseText}`
      );
    }

    console.log(`Google IndexNow success for ${url}`);
    return true;
  } catch (error) {
    console.error("Google IndexNow error:", error.message);
    return false;
  }
};

/**
 * Submit to Bing via IndexNow
 */
const submitToBing = async (url) => {
  try {
    console.log(`Submitting to Bing IndexNow: ${url}`);

    const payload = {
      host: "xenonepal.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://xenonepal.com/${INDEXNOW_KEY}.txt`,
      urlList: [url],
    };

    console.log(`Bing IndexNow payload: ${JSON.stringify(payload)}`);

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XenoNepal-IndexBot/1.0",
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `Bing IndexNow failed: ${response.status} - ${responseText}`
      );
      throw new Error(
        `Bing IndexNow failed: ${response.status} - ${responseText}`
      );
    }

    console.log(`Bing IndexNow success for ${url}`);
    return true;
  } catch (error) {
    console.error("Bing IndexNow error:", error.message);
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
    const pingResults = [];

    // Function to ping a search engine with proper error handling
    async function pingSingleEngine(engineName, pingUrl) {
      try {
        const response = await fetch(pingUrl, {
          method: "GET",
          headers: {
            "User-Agent": "XenoNepal-SitemapBot/1.0",
          },
          timeout: 10000, // 10 seconds timeout
        });

        const result = {
          engine: engineName,
          status: response.status,
          success: response.ok,
          timestamp: new Date().toISOString(),
        };

        pingResults.push(result);
        console.log(
          `Sitemap ping to ${engineName}: ${response.status} ${
            response.ok ? "OK" : "FAILED"
          }`
        );
        return result;
      } catch (error) {
        const result = {
          engine: engineName,
          status: "error",
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        pingResults.push(result);
        console.error(`Sitemap ping to ${engineName} failed:`, error.message);
        return result;
      }
    }

    // Ping each search engine one by one to better handle errors
    await pingSingleEngine(
      "Google",
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );

    await pingSingleEngine(
      "Bing",
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );

    await pingSingleEngine(
      "Yahoo",
      `https://search.yahooapis.com/SiteExplorerService/V1/ping?sitemap=${encodeURIComponent(
        sitemapUrl
      )}`
    );

    const successCount = pingResults.filter((r) => r.success).length;

    res.json({
      success: successCount > 0,
      message: `Sitemap pinged to ${successCount}/3 search engines`,
      sitemapUrl,
      results: pingResults,
    });
  } catch (error) {
    console.error("Sitemap ping error:", error);
    res
      .status(500)
      .json({ error: "Failed to ping sitemap", message: error.message });
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
    } // In production, this would use Google's Indexing API with service account
    // For now, we'll simulate the process

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

    // Log the submission    // Add to indexing queue
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
