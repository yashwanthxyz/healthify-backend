require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.ACCOUNT_SID,
      process.env.AUTH_TOKEN
    );

    // Routes
    app.use("/api/v1", authRoutes);

    // Health check endpoint
    app.get("/api/v1/health", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });

    // Test Twilio endpoint
    app.get("/api/v1/test-twilio", async (req, res) => {
      try {
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
        const { userName, location, emergencyContact } = req.body;

        await twilioClient.messages.create({
          body: `SOS! Emergency alert from team healthify.\n${userName} might be suffering from a heart Stroke.\n${location}`,
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

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log("Environment:", process.env.NODE_ENV);
      console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
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

startServer();
