const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true
    },
    userEmail: {
      type: String,
      required: true,
      trim: true
    },
    userInterest: {
      type: String,
      enum: ["Adventure", "Spiritual", "Luxury", "Budget"],
      default: "Adventure"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const travelGroupSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    totalCount: {
      type: Number,
      required: true,
      min: 2
    },
    filledCount: {
      type: Number,
      required: true,
      min: 1
    },
    hostName: {
      type: String,
      required: true,
      trim: true
    },
    hostEmail: {
      type: String,
      trim: true,
      default: ""
    },
    hostInterest: {
      type: String,
      enum: ["Adventure", "Spiritual", "Luxury", "Budget"],
      default: "Adventure"
    },
    hostRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.8
    },
    hostVerified: {
      type: Boolean,
      default: true
    },
    joinRequests: {
      type: [joinRequestSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TravelGroup", travelGroupSchema);
