const mongoose = require("mongoose");
const User = require("./src/user/user.model");

async function makeUserAdmin() {
  try {
    await mongoose.connect("mongodb://localhost:27017/aliensubs", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const result = await User.updateOne(
      { email: "khadka.sakar10@gmail.com" },
      { $set: { role: "admin" } }
    );

    if (result.matchedCount === 0) {
      console.log("User not found with email: khadka.sakar10@gmail.com");
      console.log("Creating user with admin role...");

      // Create user if not exists
      const newUser = await User.create({
        name: "Admin User",
        email: "khadka.sakar10@gmail.com",
        googleId: "temp-google-id-admin",
        role: "admin",
        status: "active",
      });
      console.log("Created admin user:", {
        email: newUser.email,
        role: newUser.role,
      });
    } else if (result.modifiedCount === 1) {
      console.log("Successfully updated user to admin role");
    } else {
      console.log("User was already an admin");
    }

    const user = await User.findOne({ email: "khadka.sakar10@gmail.com" });
    console.log(
      "Final user details:",
      user ? { email: user.email, role: user.role } : "Not found"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

makeUserAdmin();
