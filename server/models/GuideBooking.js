const mongoose = require("mongoose");

const guideBookingSchema = new mongoose.Schema(
  {
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideProfile",
      required: true,
      index: true,
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // optional — links this booking to a travel group
    tripGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelGroup",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    // message the traveler sends with the booking request
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "completed"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuideBooking", guideBookingSchema);