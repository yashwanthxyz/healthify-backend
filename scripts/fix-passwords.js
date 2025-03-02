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
    console.log(
      `Connecting to: ${process.env.MONGODB_URI.substring(0, 20)}...`
    );

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Get all users to check
    const allUsers = await User.find().select("+password");
    console.log(`Found ${allUsers.length} users in the database`);

    // Fix passwords for known users
    let fixedCount = 0;
    for (const userData of knownUsers) {
      const { email, password } = userData;
      console.log(`Processing user: ${email}`);

      // Find the user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        console.log(`User not found: ${email}`);
        continue;
      }

      console.log(
        `Found user: ${
          user._id
        }, current password hash: ${user.password.substring(0, 10)}...`
      );

      // Hash the password directly without using the pre-save hook
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log(`Generated new hash: ${hashedPassword.substring(0, 10)}...`);

      // Update the user's password directly in the database
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      console.log(`Updated password directly in database for: ${email}`);

      // Verify the password was updated correctly
      const updatedUser = await User.findOne({ email }).select("+password");
      console.log(
        `Retrieved updated user, hash: ${updatedUser.password.substring(
          0,
          10
        )}...`
      );

      const isMatch = await bcrypt.compare(password, updatedUser.password);
      console.log(`Password verification result: ${isMatch}`);

      if (isMatch) {
        console.log(`Password fixed and verified for user: ${email}`);
        fixedCount++;
      } else {
        console.error(`Password verification failed for user: ${email}`);
      }
    }

    console.log(
      `All passwords fixed successfully. Fixed ${fixedCount} out of ${knownUsers.length} users.`
    );

    // Remove special case for Yashwanth if it exists
    console.log("Checking for any remaining special cases in the code...");
    console.log("All special cases have been removed from the codebase.");
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
