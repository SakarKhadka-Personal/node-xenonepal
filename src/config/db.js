const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

const dbConnect = () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      // In production, it's useful to know when the DB is connected
      console.info(
        `[${new Date().toISOString()}] Database connection established`
      );
    })
    .catch((err) => {
      console.error(
        `[${new Date().toISOString()}] Database connection error:`,
        err
      );
    });
};

module.exports = dbConnect;
