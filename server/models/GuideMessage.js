const mongoose = require("mongoose");

const guideMessageSchema = new mongoose.Schema(
  {
    // conversation is identified by guideId + travelerId pair
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
      index: true,
    },
    // who sent this particular message
    senderRole: {
      type: String,
      enum: ["guide", "traveler"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
  },
  { timestamps: true }
);

// compound index so we can fetch a conversation efficiently
guideMessageSchema.index({ guideId: 1, travelerId: 1, createdAt: 1 });

module.exports = mongoose.model("GuideMessage", guideMessageSchema);