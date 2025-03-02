const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Try to load from .env file in the scripts directory
const scriptEnv = dotenv.config({ path: path.join(__dirname, ".env") });
if (scriptEnv.error) {
  console.log(
    "No .env file found in scripts directory, trying parent directory..."
  );
  // Try to load from parent directory
  const parentEnv = dotenv.config({ path: path.join(__dirname, "../.env") });
  if (parentEnv.error) {
    console.error(
      "Error loading .env file from parent directory:",
      parentEnv.error
    );
    process.exit(1);
  } else {
    console.log("Loaded .env file from parent directory");
  }
} else {
  console.log("Loaded .env file from scripts directory");
}

// Check environment variables
console.log("\nEnvironment Variables Check:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✓ Set" : "✗ Not Set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Set" : "✗ Not Set");
console.log("PORT:", process.env.PORT || "✗ Not Set (will use default 8000)");
console.log(
  "NODE_ENV:",
  process.env.NODE_ENV || "✗ Not Set (will use development)"
);

// Test MongoDB connection
const testConnection = async () => {
  try {
    console.log("\nTesting MongoDB connection...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log(
      `Connecting to: ${process.env.MONGODB_URI.substring(0, 20)}...`
    );

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Successfully connected to MongoDB");

    // Check for collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach((collection) => {
      console.log(`- ${collection.name}`);
    });

    // Count users
    const userCount = await mongoose.connection.db
      .collection("users")
      .countDocuments();
    console.log(`Found ${userCount} users in the database`);

    console.log("\n✓ Database check completed successfully");
  } catch (error) {
    console.error("\n✗ Database connection error:", error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
    process.exit(0);
  }
};

testConnection();
