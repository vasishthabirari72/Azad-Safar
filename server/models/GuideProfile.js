const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const guideProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    cities: {
      type: [String],
      default: [],
    },
    states: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    // pending = registered but not yet approved
    // active  = visible to travelers
    // suspended = temporarily hidden
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index for destination-based lookups from the marketplace
guideProfileSchema.index({ cities: 1, status: 1 });
guideProfileSchema.index({ states: 1, status: 1 });

module.exports = mongoose.model("GuideProfile", guideProfileSchema);