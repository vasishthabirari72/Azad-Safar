const Place = require("../models/Place");
const { normalizePlace, normalizePlacesPayload } = require("../utils/placeNormalizer");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* =========================
   BULK INSERT
   ========================= */
const bulkInsertPlaces = async (req, res) => {
  try {
    const places = normalizePlacesPayload(req.body);

    if (!Array.isArray(places)) {
      return res.status(400).json({
        message: "Request body must be an array or contain an array called 'places'"
      });
    }

    const lastPlace = await Place.findOne().sort({ id: -1 }).select("id");
    const firstGeneratedId = Number(lastPlace?.id || 0) + 1;
    const normalizedPlaces = places.map((place, index) =>
      normalizePlace(place, firstGeneratedId + index)
    );

    if (!normalizedPlaces.length) {
      return res.status(400).json({ message: "No places were provided" });
    }

    const operations = normalizedPlaces.map((place) => {
      const { id, slug, ...setFields } = place;
      const filter = slug ? { slug } : { id };

      return {
        updateOne: {
          filter,
          update: {
            $set: { ...setFields, slug },
            $setOnInsert: { id }
          },
          upsert: true
        }
      };
    });

    const result = await Place.bulkWrite(operations, { ordered: false });

    res.status(201).json({
      message: "Bulk import completed",
      insertedCount: result.upsertedCount || 0,
      updatedCount: result.modifiedCount || 0,
      matchedCount: result.matchedCount || 0
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
    const { featured, limit, category, page, sort } = req.query;
    const query = featured === "true" ? { category: { $in: ["high-rated", "recommended", "hidden-gem"] } } : {};

    if (category) {
      query.category = { $in: [category] };
    }

    const pageSize = Math.min(Number(limit) || (featured === "true" ? 60 : 20), 200);

    // Paginated mode — only when `page` param is explicitly provided
    if (page !== undefined) {
      const sortMap = {
        "rating-high":  { rating: -1, popularityScore: -1, title: 1 },
        "rating-low":   { rating: 1, title: 1 },
        "alphabetical": { title: 1 },
      };
      const sortOrder = sortMap[sort] || { rating: -1, popularityScore: -1, title: 1 };
      const currentPage = Math.max(Number(page) || 1, 1);
      const skip = (currentPage - 1) * pageSize;

      const [places, total] = await Promise.all([
        Place.find(query).sort(sortOrder).skip(skip).limit(pageSize),
        Place.countDocuments(query),
      ]);

      return res.status(200).json({
        places,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
      });
    }

    // Legacy mode — return plain array (all other callers unchanged)
    const placesQuery = Place.find(query).sort({ rating: -1, popularityScore: -1, title: 1 });
    if (pageSize > 0) placesQuery.limit(pageSize);
    const places = await placesQuery;
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
    const lastPlace = await Place.findOne().sort({ id: -1 }).select("id");
    const place = await Place.create(normalizePlace(req.body, Number(lastPlace?.id || 0) + 1));
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

const searchPlaces = async (req, res) => {
  try {
    const { q, rating, category, sort } = req.query;

    if (!q || !String(q).trim()) {
      return res.status(400).json({ message: "No query sent" });
    }

    // Tokenize: each word must appear in at least one field (cap at 6 words)
    const rawWords = String(q).trim().split(/\s+/).filter(Boolean).slice(0, 6);
    const safeWords = rawWords.map(escapeRegex);
    const safeQ = escapeRegex(String(q).trim());

    const wordFilters = safeWords.map((word) => ({
      $or: [
        { title: { $regex: word, $options: "i" } },
        { city: { $regex: word, $options: "i" } },
        { state: { $regex: word, $options: "i" } },
        { district: { $regex: word, $options: "i" } },
        { description: { $regex: word, $options: "i" } },
        { destinationCategory: { $regex: word, $options: "i" } },
        { subcategory: { $regex: word, $options: "i" } },
        { tags: { $regex: word, $options: "i" } },
      ],
    }));

    const matchStage = { $and: wordFilters };
    if (rating) matchStage.rating = { $gte: Number(rating) };
    if (category) matchStage.category = { $in: [category] };

    // Helpers for aggregation scoring
    const str = (field) => ({ $ifNull: [`$${field}`, ""] });
    const tagHit = (word) => ({
      $gt: [
        {
          $size: {
            $filter: {
              input: { $ifNull: ["$tags", []] },
              as: "t",
              cond: { $regexMatch: { input: "$$t", regex: word, options: "i" } },
            },
          },
        },
        0,
      ],
    });

    // Build score: full-phrase matches score highest, per-word matches score less
    const scoreComponents = [
      { $cond: [{ $regexMatch: { input: str("title"), regex: safeQ, options: "i" } }, 20, 0] },
      { $cond: [{ $regexMatch: { input: str("city"),  regex: safeQ, options: "i" } }, 12, 0] },
    ];

    for (const word of safeWords) {
      scoreComponents.push(
        { $cond: [{ $regexMatch: { input: str("title"),               regex: word, options: "i" } }, 10, 0] },
        { $cond: [{ $regexMatch: { input: str("city"),                regex: word, options: "i" } }, 6,  0] },
        { $cond: [{ $regexMatch: { input: str("state"),               regex: word, options: "i" } }, 4,  0] },
        { $cond: [{ $regexMatch: { input: str("destinationCategory"), regex: word, options: "i" } }, 3,  0] },
        { $cond: [{ $regexMatch: { input: str("subcategory"),         regex: word, options: "i" } }, 3,  0] },
        { $cond: [tagHit(word), 3, 0] },
        { $cond: [{ $regexMatch: { input: str("description"),         regex: word, options: "i" } }, 1,  0] },
      );
    }

    // Quality boost from native signals
    scoreComponents.push(
      { $multiply: [{ $ifNull: ["$rating", 0] }, 1.5] },
      { $multiply: [{ $ifNull: ["$popularityScore", 0] }, 0.02] },
    );

    const sortStage =
      sort === "rating-high"  ? { rating: -1, _score: -1 } :
      sort === "rating-low"   ? { rating: 1 } :
      sort === "alphabetical" ? { title: 1 } :
                                { _score: -1, rating: -1 };

    const pipeline = [
      { $match: matchStage },
      { $addFields: { _score: { $add: scoreComponents } } },
      { $sort: sortStage },
      { $limit: 80 },
      { $project: { _score: 0 } },
    ];

    const places = await Place.aggregate(pipeline);
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
