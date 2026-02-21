const mongoose = require("mongoose");

const tripMessageSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelGroup",
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TripMessage", tripMessageSchema);
