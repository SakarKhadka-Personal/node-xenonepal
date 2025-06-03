const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

const dbConnect = () => {
  mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
  });
};

module.exports = dbConnect;
