const path = require("path");
// Ensure environment variables are loaded correctly
const dotenv = require("dotenv");

// Try multiple locations for the .env file
console.log("Current directory:", __dirname);
console.log("Attempting to load .env file...");

// First try the new .env file
let envResult = dotenv.config({ path: path.join(__dirname, ".env.new") });
if (envResult.error) {
  console.log("No .env.new file found, trying .env...");
  // Try regular .env file
  envResult = dotenv.config({ path: path.join(__dirname, ".env") });
  if (envResult.error) {
    console.log(
      "No .env file found in current directory, trying parent directory..."
    );
    // Try parent directory
    envResult = dotenv.config({ path: path.join(__dirname, "../.env") });
    if (envResult.error) {
      console.error(
        "Error loading .env file from all locations:",
        envResult.error
      );
      // Last resort: set environment variables manually for development
      if (process.env.NODE_ENV !== "production") {
        console.log("Setting default environment variables for development...");
        process.env.MONGODB_URI =
          "mongodb+srv://healthify:healthify@cluster0.mongodb.net/healthify";
        process.env.JWT_SECRET = "healthify_jwt_secret_key_2024";
        process.env.PORT = "8000";
        process.env.NODE_ENV = "development";
      }
    } else {
      console.log("Loaded .env file from parent directory");
    }
  } else {
    console.log("Loaded .env file from current directory");
  }
} else {
  console.log("Loaded .env.new file from current directory");
}

// Debug: Print environment variables
console.log("\nEnvironment Variables:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not Set");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });
  next();
};

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const app = express();

    // CORS configuration
    app.use(
      cors({
        origin: "*", // Allow all origins for mobile app access
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
      })
    );

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);

    // Initialize Twilio client (optional)
    let twilioClient = null;
    if (
      process.env.ACCOUNT_SID &&
      process.env.AUTH_TOKEN &&
      process.env.ACCOUNT_SID !== "YOUR_TWILIO_ACCOUNT_SID"
    ) {
      try {
        const twilio = require("twilio");
        twilioClient = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
        console.log("Twilio client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Twilio client:", error.message);
        console.log("SMS features will be disabled");
      }
    } else {
      console.log(
        "Twilio credentials not found or are placeholder values, SMS features will be disabled"
      );
    }

    // Routes
    app.use("/api/v1/auth", authRoutes);

    // Health check endpoint
    app.get("/api/v1/health", (req, res) => {
      res.json({
        status: "ok",
        message: "Server is running",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Test Twilio endpoint (only if Twilio is configured)
    if (twilioClient) {
      app.post("/api/v1/test-twilio", async (req, res) => {
        try {
          if (!process.env.TEST_PHONE_NUMBER) {
            return res.status(400).json({
              status: "error",
              message: "TEST_PHONE_NUMBER environment variable is not defined",
            });
          }

          await twilioClient.messages.create({
            body: "Test message from Healthify app",
            from: process.env.TWILIO_NUMBER,
            to: process.env.TEST_PHONE_NUMBER,
          });

          res.json({
            status: "success",
            message: "Test message sent successfully",
          });
        } catch (error) {
          console.error("Twilio test error:", error);
          res.status(500).json({
            status: "error",
            message: "Failed to send test message",
            error: error.message,
          });
        }
      });

      // SOS endpoint
      app.post("/api/v1/sos", async (req, res) => {
        try {
          const { userName, location, emergencyContact, message, medicalInfo } =
            req.body;

          if (!userName || !location || !emergencyContact) {
            return res.status(400).json({
              status: "error",
              message: "Missing required fields",
            });
          }

          const customMessage =
            message ||
            `SOS! Emergency alert from team healthify.\n${userName} might be suffering from a heart Stroke.`;
          let smsBody = `${customMessage}\nLocation: ${location}`;

          if (medicalInfo) {
            smsBody += `\nMedical Info: ${medicalInfo}`;
          }

          await twilioClient.messages.create({
            body: smsBody,
            from: process.env.TWILIO_NUMBER,
            to: emergencyContact,
          });

          res.json({
            status: "success",
            message: "Emergency alert sent successfully",
          });
        } catch (error) {
          console.error("Error sending SOS:", error);
          res.status(500).json({
            status: "error",
            message: "Failed to send emergency alert",
            error: error.message,
          });
        }
      });
    }

    // Catch-all route for undefined routes
    app.use("*", (req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
      });
    });

    // Error handling middleware - must be after all routes
    app.use(errorHandler);

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log("Environment:", process.env.NODE_ENV);
      console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
      console.log("JWT Secret:", process.env.JWT_SECRET ? "Set" : "Not Set");
      console.log("Twilio Config:", {
        accountSid: process.env.ACCOUNT_SID ? "Set" : "Not Set",
        authToken: process.env.AUTH_TOKEN ? "Set" : "Not Set",
        twilioNumber: process.env.TWILIO_NUMBER ? "Set" : "Not Set",
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process here, just log the error
});

startServer();
