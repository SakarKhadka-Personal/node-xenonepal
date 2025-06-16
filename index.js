require("dotenv").config();
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const dbConnect = require("./src/config/db");
const cors = require("cors");

const PORT = process.env.PORT || 5000;
const app = express();

// Initialize email service on startup
console.log("🚀 Starting XenoNepal Server...");
console.log("Environment:", process.env.NODE_ENV);

// Security middleware
app.use(helmet());

// Auto-close slow connections after 10s
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    return res.status(408).json({ message: "Request Timeout" });
  });
  next();
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Enable gzip compression
app.use(compression());

app.use(
  cors({
    origin: [
      "https://xenonepal.com",
      "https://www.xenonepal.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

// Product Routes
const productRoute = require("./src/product/product.route");
app.use("/api/products", productRoute);

// User Routes
const userRoute = require("./src/user/user.route");
app.use("/api/users", userRoute);

// Order Routes
const orderRoute = require("./src/order/order.route");
app.use("/api/orders", orderRoute);

// Settings Routes
const settingsRoute = require("./src/settings/setting.route");
app.use("/api/settings", settingsRoute);

// SEO Routes
const seoRoute = require("./src/seo/seo.route");
app.use("/api/seo", seoRoute);

// Email Routes
const emailRoute = require("./src/email/email.route");
app.use("/api/email", emailRoute);

//Root Route For Checking Server Status
app.get("/", function (req, res) {
  res.send("Server Is Running Perfectly");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Handle 404 errors
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Initialize database connection
dbConnect();

// Initialize email service
console.log("📧 Initializing email service...");
const emailService = require("./src/email/emailService");

// Start server
const server = app.listen(PORT, function () {
  console.log(`✅ Server Is Running On Port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🌍 Production URL: https://xenonepal.com`);
  }
});

// Set server timeout to prevent hanging connections
server.timeout = 30000; // 30 seconds

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});
