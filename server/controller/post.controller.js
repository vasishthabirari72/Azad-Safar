const Place = require("../models/Place");

/* =========================
   BULK INSERT
   ========================= */
const bulkInsertPlaces = async (req, res) => {
  try {
    const { places } = req.body;

    if (!Array.isArray(places)) {
      return res.status(400).json({
        message: "Request body must contain an array called 'places'"
      });
    }

    const result = await Place.insertMany(places, { ordered: false });

    res.status(201).json({
      message: "Bulk insert completed",
      insertedCount: result.length
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(207).json({
        message: "Some records were skipped due to duplicate IDs"
      });
    }
    res.status(500).json({ message: "Bulk insert failed", error: error.message });
  }
};

/* =========================
   BASIC CRUD
   ========================= */

const getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.status(200).json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlace = async (req, res) => {
  try {
    const place = await Place.findOne({ id: Number(req.params.id) });
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }
    res.status(200).json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlaceReviews = async (req, res) => {
  try {
    const { sort = "newest" } = req.query;
    const place = await Place.findOne({ id: Number(req.params.id) }).select("reviews");
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    const reviews = [...(place.reviews || [])];
    if (sort === "highest-rated") {
      reviews.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addPlaceReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const parsedRating = Number(rating);

    if (!name || !comment || Number.isNaN(parsedRating)) {
      return res.status(400).json({ message: "name, rating and comment are required" });
    }

    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const place = await Place.findOne({ id: Number(req.params.id) });
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    place.reviews.push({
      name: String(name).trim(),
      rating: parsedRating,
      comment: String(comment).trim(),
      helpfulCount: 0
    });

    await place.save();
    const createdReview = place.reviews[place.reviews.length - 1];
    res.status(201).json(createdReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const markReviewHelpful = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const place = await Place.findOne({ id: Number(id) });
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    const review = place.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.helpfulCount = Number(review.helpfulCount || 0) + 1;
    await place.save();

    res.status(200).json({ reviewId, helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createPlace = async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json(place);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePlace = async (req, res) => {
  try {
    const place = await Place.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    res.status(200).json(place);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePlace = async (req, res) => {
  try {
    const place = await Place.findOneAndDelete({ id: Number(req.params.id) });

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    res.status(200).json({ message: "Place deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAllPlaces = async (req, res) => {
  try {
    const result = await Place.deleteMany({});
    res.status(200).json({
      message: "All places deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   EXPLORE-SPECIFIC APIs
   ========================= */

const getStates = async (req, res) => {
  try {
    const states = await Place.distinct("state");
    res.json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCities = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ message: "State is required" });
    }
    const cities = await Place.find({ state }).distinct("city");
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCitiesWithImages = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ message: "State is required" });
    }

    const cities = await Place.aggregate([
      { $match: { state } },
      { $group: { _id: "$city", image: { $first: "$image" } } },
      { $project: { _id: 0, city: "$_id", image: 1 } }
    ]);

    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlacesByCity = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }
    const places = await Place.find({ city });
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStatesWithImages = async (req, res) => {
  try {
    const states = await Place.aggregate([
      { $group: { _id: "$state", image: { $first: "$image" } } },
      { $project: { _id: 0, state: "$_id", image: 1 } }
    ]);
    res.status(200).json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FIX: category is a [String] array in the model — must use $elemMatch or $in, not equality
const searchPlaces = async (req, res) => {
  try {
    const { q, rating, category, sort } = req.query;

    if (!q) {
      return res.status(400).json({ message: "No query sent" });
    }

    const query = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { state: { $regex: q, $options: "i" } }
      ]
    };

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // FIX: was `query.category = category` which never matches an array field
    if (category) {
      query.category = { $in: [category] };
    }

    let places = await Place.find(query);

    if (sort === "rating-high") {
      places.sort((a, b) => b.rating - a.rating);
    } else if (sort === "rating-low") {
      places.sort((a, b) => a.rating - b.rating);
    } else if (sort === "alphabetical") {
      places.sort((a, b) => a.title.localeCompare(b.title));
    }

    res.status(200).json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlaces,
  getPlace,
  getPlaceReviews,
  addPlaceReview,
  markReviewHelpful,
  createPlace,
  updatePlace,
  deletePlace,
  bulkInsertPlaces,
  deleteAllPlaces,
  getStates,
  getCities,
  getCitiesWithImages,
  getPlacesByCity,
  getStatesWithImages,
  searchPlaces
};