const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5, // Limit connection pool to 5
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // prevent app from running if DB is down
  }
};

module.exports = dbConnect;
