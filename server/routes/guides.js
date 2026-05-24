const express = require("express");
const router = express.Router();
const {
  getGuides,
  getGuide,
  updateGuide,
  updateGuideStatus,
  createBooking,
  getBookings,
  reviewBooking,
  createReview,
  getMessages,
  sendMessage,
  getPendingGuides,
} = require("../controller/guide.controller");

const { getMyProfile } = require("../controller/guide.controller");

// static routes MUST come before /:id
router.get("/pending", getPendingGuides);
router.get("/mine", getMyProfile);

router.get("/", getGuides);
router.get("/:id", getGuide);
router.patch("/:id", updateGuide);
router.patch("/:id/status", updateGuideStatus);

router.post("/:id/bookings", createBooking);
router.get("/:id/bookings", getBookings);
router.patch("/:id/bookings/:bookingId", reviewBooking);

router.post("/:id/reviews", createReview);

router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);

module.exports = router;