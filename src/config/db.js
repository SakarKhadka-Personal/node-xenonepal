const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    console.log("📡 Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      maxPoolSize: 5, // Limit connection pool to 5
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // prevent app from running if DB is down
  }
};

module.exports = dbConnect;
