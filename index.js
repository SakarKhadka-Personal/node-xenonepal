require("dotenv").config();
const express = require("express");
dbConnect = require("./src/config/db");
const cors = require("cors");

const PORT = 5000;

const app = express();
dbConnect();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://xenonepal.vercel.app"],
    credentials: true,
  })
);

// Product Routes
const productRoute = require("./src/product/product.route");
app.use("/api/products", productRoute);

//Root Route For Checking Server Status
app.get("/", function (req, res) {
  res.send("Server Is Running Perfectly");
});

// Checking For Ports
app.listen(PORT, function () {
  console.log(`Server Is Running On Port ${PORT}`);
});
