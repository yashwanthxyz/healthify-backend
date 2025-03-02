const mongoose = require("mongoose");

// Use environment variable instead of hardcoded connection string
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log(
      `Attempting to connect to MongoDB: ${process.env.MONGODB_URI.substring(
        0,
        20
      )}...`
    );

    // Configure mongoose options
    const options = {
      // These options are no longer needed in Mongoose 6+, but kept for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(
      `Connection State: ${mongoose.STATES[mongoose.connection.readyState]}`
    );

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

    // Return the connection for potential use elsewhere
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // Add more detailed error information
    if (error.name === "MongoServerSelectionError") {
      console.error("Could not connect to any MongoDB servers. Please check:");
      console.error("1. Your network connection");
      console.error("2. MongoDB connection string is correct");
      console.error("3. MongoDB server is running and accessible");
    }

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
