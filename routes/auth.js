const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Register User
router.post("/user-register", async (req, res) => {
  try {
    // TODO: Implement user registration
    res.json({ status: "success", message: "Registration endpoint" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Login User
router.post("/user-login", async (req, res) => {
  try {
    // TODO: Implement user login
    res.json({ status: "success", message: "Login endpoint" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get User Profile
router.get("/user-me", async (req, res) => {
  try {
    // TODO: Implement get user profile
    res.json({ status: "success", message: "User profile endpoint" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
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

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
