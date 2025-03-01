const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Ensure password is a string
  const passwordString =
    typeof this.password === "string" ? this.password : String(this.password);
  console.log(
    "Pre-save hook: Password type after conversion:",
    typeof passwordString
  );
  console.log("Pre-save hook: Password length:", passwordString.length);
  console.log("Pre-save hook: Password value:", passwordString);

  try {
    // Use consistent salt rounds (12)
    this.password = await bcrypt.hash(passwordString, 12);
    console.log("Pre-save hook: Hashed password length:", this.password.length);
    console.log(
      "Pre-save hook: First 10 chars of hash:",
      this.password.substring(0, 10)
    );
    console.log("Pre-save hook: Full hash:", this.password);
    next();
  } catch (error) {
    console.error("Pre-save hook: Error hashing password:", error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Ensure candidate password is a string
  const passwordString =
    typeof candidatePassword === "string"
      ? candidatePassword
      : String(candidatePassword);
  console.log(
    "comparePassword method: Password type after conversion:",
    typeof passwordString
  );
  console.log(
    "comparePassword method: Password length:",
    passwordString.length
  );
  console.log("comparePassword method: Password value:", passwordString);
  console.log("comparePassword method: Stored hash:", this.password);

  try {
    const isMatch = await bcrypt.compare(passwordString, this.password);
    console.log("comparePassword method: Match result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("comparePassword method: Error during comparison:", error);
    // Try manual comparison as a last resort
    try {
      // This is a fallback only - not recommended for production
      const salt = this.password.substring(0, 29); // Extract the salt from the hash
      console.log("comparePassword method: Extracted salt:", salt);
      const newHash = await bcrypt.hash(passwordString, salt);
      console.log(
        "comparePassword method: New hash with extracted salt:",
        newHash
      );
      const manualMatch = newHash === this.password;
      console.log("comparePassword method: Manual match result:", manualMatch);
      return manualMatch;
    } catch (fallbackError) {
      console.error("comparePassword method: Fallback error:", fallbackError);
      return false;
    }
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
