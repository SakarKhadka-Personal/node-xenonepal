const mongoose = require("mongoose");
const User = require("./src/user/user.model");

async function makeUserAdmin() {
  try {
    await mongoose.connect("mongodb://localhost:27017/aliensubs", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await User.updateOne(
      { email: "khadka.sakar10@gmail.com" },
      { $set: { role: "admin" } }
    );

    if (result.matchedCount === 0) {
      // Create user if not exists
      const newUser = await User.create({
        name: "Admin User",
        email: "khadka.sakar10@gmail.com",
        googleId: "temp-google-id-admin",
        role: "admin",
        status: "active",
      });
    }

    const user = await User.findOne({ email: "khadka.sakar10@gmail.com" });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

makeUserAdmin();
