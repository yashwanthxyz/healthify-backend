const mongoose = require("mongoose");

// Use environment variable instead of hardcoded connection string
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Configure mongoose options
    const options = {
      // These options are no longer needed in Mongoose 6+, but kept for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Set up connection error handlers
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected, attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In production, we should throw the error but not exit the process
    // This allows the server to handle the error gracefully
    if (process.env.NODE_ENV === "production") {
      console.error(
        "MongoDB connection failed in production, continuing to serve cached data if possible"
      );
    } else {
      // In development, we might want to exit to force fixing the issue
      process.exit(1);
    }
  }
};

module.exports = connectDB;
