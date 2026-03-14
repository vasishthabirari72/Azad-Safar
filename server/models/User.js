const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["traveler", "guide"],
      default: "traveler",
    },
    interest: {
      type: String,
      enum: ["Adventure", "Spiritual", "Luxury", "Budget"],
      default: "Adventure",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);