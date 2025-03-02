const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Register User
router.post("/user-register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      console.log("Missing required fields:", {
        fullName,
        email,
        password: !!password,
      });
      return res.status(400).json({
        status: "error",
        message:
          "Please provide all required fields: fullName, email, password",
      });
    }

    // Ensure password is a string
    const passwordString =
      typeof password === "string" ? password : String(password);
    console.log("Password type after conversion:", typeof passwordString);
    console.log("Password length:", passwordString.length);

    // Check if user already exists
    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists with email:", email);
      return res.status(400).json({
        status: "error",
        message: "User already exists with this email",
      });
    }

    // Create new user - let the model's pre-save hook handle the password hashing
    console.log("Creating new user with email:", email);
    const user = new User({
      fullName,
      email,
      password: passwordString, // The pre-save hook will hash this
    });

    await user.save();
    console.log("User saved successfully:", user._id);

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    console.log("JWT token generated for user:", user._id);

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Registration failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Login User
router.post("/user-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt with email:", email);
    console.log("Password length:", password ? password.length : 0);
    console.log("Password type:", typeof password);
    console.log("Request body:", JSON.stringify(req.body));
    console.log("Request headers:", req.headers);

    // Ensure password is a string
    const passwordString =
      typeof password === "string" ? password : String(password);
    console.log("Converted password type:", typeof passwordString);
    console.log("Converted password:", passwordString);

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    console.log("User found:", user._id);
    console.log("Stored password hash length:", user.password.length);
    console.log("First 10 chars of hash:", user.password.substring(0, 10));

    // Check password using the model's method
    const isMatch = await user.comparePassword(passwordString);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Password does not match for user:", user._id);
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Login failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get User Profile
router.get("/user-me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        emergencyContacts: user.emergencyContacts,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to get user profile",
    });
  }
});

// Update User Profile
router.put("/user-me", protect, async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      height: req.body.height,
      weight: req.body.weight,
      age: req.body.age,
      gender: req.body.gender,
      emergencyContacts: req.body.emergencyContacts,
    };

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        emergencyContacts: user.emergencyContacts,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({
      status: "error",
      message: error.message || "Failed to update profile",
    });
  }
});

module.exports = router;
