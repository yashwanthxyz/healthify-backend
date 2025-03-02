const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide your full name"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    emergencyContacts: [
      {
        name: String,
        phone: String,
      },
    ],
    height: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    age: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

  try {
    // Ensure password is a string
    const passwordString = String(this.password);
    console.log("Pre-save hook: Password type:", typeof passwordString);
    console.log("Pre-save hook: Password length:", passwordString.length);

    // Use a consistent salt rounds value (12)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(passwordString, salt);

    console.log("Pre-save hook: Hashed password length:", this.password.length);
    console.log(
      "Pre-save hook: First 10 chars of hash:",
      this.password.substring(0, 10)
    );

    next();
  } catch (error) {
    console.error("Pre-save hook: Error hashing password:", error);
    next(error);
  }
});

// Update lastLogin when user logs in
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Ensure candidate password is a string
    const passwordString = String(candidatePassword);
    console.log(
      "comparePassword method: Password type:",
      typeof passwordString
    );
    console.log(
      "comparePassword method: Password length:",
      passwordString.length
    );
    console.log("comparePassword method: Stored hash:", this.password);

    // Use bcrypt's compare function
    const isMatch = await bcrypt.compare(passwordString, this.password);
    console.log("comparePassword method: Match result:", isMatch);

    return isMatch;
  } catch (error) {
    console.error("comparePassword method: Error comparing passwords:", error);
    return false;
  }
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
