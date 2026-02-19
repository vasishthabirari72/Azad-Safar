const express = require("express");
const router = express.Router();

const {
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
} = require("../controller/post.controller");

/* =========================
   SPECIAL / STATIC ROUTES
   ========================= */

// Bulk insert
router.post("/bulk", bulkInsertPlaces);

// Delete all places
router.delete("/all", deleteAllPlaces);

// 🔥 IMPORTANT: STATIC ROUTES FIRST
router.get("/states-with-images", getStatesWithImages);
router.get("/cities-with-images", getCitiesWithImages); // 🆕 NEW ROUTE
router.get("/states", getStates);
router.get("/cities", getCities);
router.get("/by-city", getPlacesByCity);
router.get("/search", searchPlaces);
router.get("/:id/reviews", getPlaceReviews);
router.post("/:id/reviews", addPlaceReview);
router.post("/:id/reviews/:reviewId/helpful", markReviewHelpful);

// Test route
router.get("/test", (req, res) => {
  res.send("Places route working");
});

/* =========================
   BASIC CRUD
   ========================= */

// Get all places
router.get("/", getPlaces);

// Create place
router.post("/", createPlace);

// Get single place (⚠️ MUST BE LAST)
router.get("/:id", getPlace);

// Update place
router.put("/:id", updatePlace);

// Delete place
router.delete("/:id", deletePlace);

module.exports = router;
