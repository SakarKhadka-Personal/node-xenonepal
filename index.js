require("dotenv").config();
const express = require("express");
const compression = require("compression");
dbConnect = require("./src/config/db");
const cors = require("cors");

const PORT = 5000;

const app = express();
dbConnect();

// Middleware
app.use(express.json());

// ✅ Enable gzip compression with optimized settings
app.use(
  compression({
    // Compress all responses
    filter: (req, res) => {
      // Don't compress if the request has Cache-Control: no-transform directive
      if (
        req.headers["cache-control"] &&
        req.headers["cache-control"].includes("no-transform")
      ) {
        return false;
      }
      // Use compression for all other responses
      return compression.filter(req, res);
    },
    // Compression level (1-9, 9 is maximum)
    level: 6, // Good balance between compression and speed
    // Minimum response size to compress (in bytes)
    threshold: 1024, // 1KB
    // Include more MIME types for compression
    types: [
      "text/plain",
      "text/html",
      "text/css",
      "text/xml",
      "text/javascript",
      "application/javascript",
      "application/xml+rss",
      "application/json",
      "application/xml",
      "image/svg+xml",
    ],
  })
);

app.use(
  cors({
    origin: [
      "https://xenonepal.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
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

//Root Route For Checking Server Status
app.get("/", function (req, res) {
  res.send("Server Is Running Perfectly");
});

// Checking For Ports
app.listen(PORT, function () {
  console.log(`Server Is Running On Port ${PORT}`);
});
