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
    // origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// Product Routes
const productRoute = require("./src/product/product.route");
app.use("/api/products", productRoute);

// User Routes
const userRoute = require("./src/user/user.route");
app.use("/api/users", userRoute);

//Root Route For Checking Server Status
app.get("/", function (req, res) {
  res.send("Server Is Running Perfectly");
});

// Checking For Ports
app.listen(PORT, function () {
  console.log(`Server Is Running On Port ${PORT}`);
});
