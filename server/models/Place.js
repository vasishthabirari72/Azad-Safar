const mongoose = require("mongoose");

/* Review Schema */
const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

/* Nearby Place Schema */
const nearbyPlaceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    distance: {
      type: String,
      required: true
    },
    travelTime: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  { _id: false } // prevents auto _id for sub-docs
);

/* Main Place Schema */
const placeSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: true,
      index: true
    },
    district: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    category: {
      type: [String],
      enum: ["high-rated", "recommended", "hidden-gem"],
      default: []
    },
    destinationCategory: {
      type: String,
      trim: true
    },
    subcategory: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      required: true
    },
    image2: {
      type: String
    },
    imageUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    bestSeason: {
      type: [String],
      default: []
    },
    difficulty: {
      type: String,
      trim: true
    },
    entryFee: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    popularityScore: {
      type: Number
    },
    nearbyPlaces: {
      type: [nearbyPlaceSchema],
      default: []
    },
    reviews: {
      type: [reviewSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Place", placeSchema);
