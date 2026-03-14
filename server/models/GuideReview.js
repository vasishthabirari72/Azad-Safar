const mongoose = require("mongoose");

const guideReviewSchema = new mongoose.Schema(
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
    // review is only allowed after a completed booking
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideBooking",
      required: true,
      unique: true, // one review per booking
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuideReview", guideReviewSchema);