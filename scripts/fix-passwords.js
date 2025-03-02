const path = require("path");
// Load environment variables from .env file in the scripts directory
require("dotenv").config({ path: path.join(__dirname, ".env") });
// If that fails, try loading from parent directory
if (!process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// Known user credentials for fixing
const knownUsers = [
  { email: "yashwanth@gmail.com", password: "Yash@2910" },
  { email: "sanjay@gmail.com", password: "Sanjay@123" },
  { email: "nani@gmail.com", password: "Nani@123" },
  // Add more users as needed
];

const fixPasswords = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");

    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log("MongoDB URI found in environment variables");

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Fix passwords for known users
    for (const userData of knownUsers) {
      const { email, password } = userData;
      console.log(`Fixing password for user: ${email}`);

      // Find the user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        console.log(`User not found: ${email}`);
        continue;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update the user's password
      user.password = hashedPassword;
      await user.save({ validateBeforeSave: false });

      console.log(`Password fixed for user: ${email}`);
    }

    console.log("All passwords fixed successfully");
  } catch (error) {
    console.error("Error fixing passwords:", error);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  }
};

// Run the script
fixPasswords();
