const mongoose = require("mongoose");
const GuideProfile = require("../models/GuideProfile");
const GuideBooking = require("../models/GuideBooking");
const GuideReview = require("../models/GuideReview");
const GuideMessage = require("../models/GuideMessage");
const User = require("../models/User");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

/* =====================
   GET /api/guides
   Query: city, state, language, minRating, maxPrice, status
   Returns only active guides by default
===================== */
const getGuides = async (req, res) => {
  try {
    const { city, state, language, minRating, maxPrice } = req.query;

    const filter = { status: "active" };

    if (city) {
      filter.cities = { $regex: city, $options: "i" };
    }
    if (state) {
      filter.states = { $regex: state, $options: "i" };
    }
    if (language) {
      filter.languages = { $regex: language, $options: "i" };
    }
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }
    if (maxPrice) {
      filter.pricePerDay = { ...(filter.pricePerDay || {}), $lte: Number(maxPrice) };
    }

    const guides = await GuideProfile.find(filter)
      .populate("userId", "name email")
      .sort({ rating: -1, reviewsCount: -1 });

    res.status(200).json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   GET /api/guides/:id
===================== */
const getGuide = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }

    const guide = await GuideProfile.findById(id).populate("userId", "name email");
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    // Fetch reviews to attach
    const reviews = await GuideReview.find({ guideId: id })
      .populate("travelerId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ ...guide.toObject(), reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   PATCH /api/guides/:id
   Guide updates their own profile
   Header: x-user-email
===================== */
const updateGuide = async (req, res) => {
  try {
    const { id } = req.params;
    const email = normalizeEmail(req.headers["x-user-email"]);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const guide = await GuideProfile.findById(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    if (String(guide.userId) !== String(user._id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const allowed = ["bio", "photo", "languages", "pricePerDay", "experienceYears", "cities", "states"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        guide[field] = req.body[field];
      }
    });

    await guide.save();
    res.status(200).json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   PATCH /api/guides/:id/status
   Admin-only: approve or suspend a guide
   For now, any request with x-admin: true header is accepted
   Replace with proper admin auth when ready
===================== */
const updateGuideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }

    if (!["pending", "active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const guide = await GuideProfile.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    res.status(200).json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   POST /api/guides/:id/bookings
   Traveler sends a booking request to a guide
   Body: { travelerId, date, message, tripGroupId? }
===================== */
const createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelerId, date, message = "", tripGroupId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }
    if (!mongoose.Types.ObjectId.isValid(travelerId)) {
      return res.status(400).json({ message: "Invalid traveler id" });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const guide = await GuideProfile.findById(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }
    if (guide.status !== "active") {
      return res.status(409).json({ message: "This guide is not currently accepting bookings" });
    }

    // Prevent duplicate pending booking for same guide + traveler + date
    const existing = await GuideBooking.findOne({
      guideId: id,
      travelerId,
      date: new Date(date),
      status: "pending",
    });
    if (existing) {
      return res.status(409).json({ message: "You already have a pending booking for this date" });
    }

    const booking = await GuideBooking.create({
      guideId: id,
      travelerId,
      date: new Date(date),
      message: String(message).trim(),
      tripGroupId: tripGroupId && mongoose.Types.ObjectId.isValid(tripGroupId)
        ? tripGroupId
        : null,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   GET /api/guides/:id/bookings
   Guide views their incoming bookings
   Header: x-user-email
===================== */
const getBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const email = normalizeEmail(req.headers["x-user-email"]);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const guide = await GuideProfile.findById(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    if (String(guide.userId) !== String(user._id)) {
      return res.status(403).json({ message: "Only the guide can view their bookings" });
    }

    const bookings = await GuideBooking.find({ guideId: id })
      .populate("travelerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   PATCH /api/guides/:id/bookings/:bookingId
   Guide accepts or declines a booking
   Body: { action: "confirm" | "decline" }
   Header: x-user-email
===================== */
const reviewBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;
    const { action } = req.body;
    const email = normalizeEmail(req.headers["x-user-email"]);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    if (!["confirm", "decline", "complete"].includes(action)) {
      return res.status(400).json({ message: "Action must be confirm, decline or complete" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const guide = await GuideProfile.findById(id);
    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    if (String(guide.userId) !== String(user._id)) {
      return res.status(403).json({ message: "Only the guide can review bookings" });
    }

    const booking = await GuideBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const statusMap = { confirm: "confirmed", decline: "declined", complete: "completed" };
    booking.status = statusMap[action];
    booking.respondedAt = new Date();
    await booking.save();

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   POST /api/guides/:id/reviews
   Traveler leaves a review (only after completed booking)
   Body: { travelerId, bookingId, rating, comment }
===================== */
const createReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelerId, bookingId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid guide id" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || String(comment).trim().length < 5) {
      return res.status(400).json({ message: "Comment must be at least 5 characters" });
    }

    // Verify the booking is completed and belongs to this traveler + guide
    const booking = await GuideBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (String(booking.guideId) !== String(id)) {
      return res.status(400).json({ message: "Booking does not match this guide" });
    }
    if (String(booking.travelerId) !== String(travelerId)) {
      return res.status(403).json({ message: "You can only review your own bookings" });
    }
    if (booking.status !== "completed") {
      return res.status(409).json({ message: "You can only review after the trip is completed" });
    }

    const review = await GuideReview.create({
      guideId: id,
      travelerId,
      bookingId,
      rating: parsedRating,
      comment: String(comment).trim(),
    });

    // Recalculate guide's average rating
    const allReviews = await GuideReview.find({ guideId: id });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await GuideProfile.findByIdAndUpdate(id, {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: allReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this booking" });
    }
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   GET /api/guides/:id/messages
   Get conversation between a guide and a traveler
   Query: travelerId
   Header: x-user-email
===================== */
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelerId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(travelerId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const messages = await GuideMessage.find({ guideId: id, travelerId })
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   POST /api/guides/:id/messages
   Send a message in a guide-traveler conversation
   Body: { senderId, senderRole, message, travelerId }
===================== */
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelerId, senderRole, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(travelerId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    if (!["guide", "traveler"].includes(senderRole)) {
      return res.status(400).json({ message: "senderRole must be guide or traveler" });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const saved = await GuideMessage.create({
      guideId: id,
      travelerId,
      senderRole,
      message: String(message).trim(),
    });

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   GET /api/guides/pending
   Admin: list all pending guide applications
===================== */
const getPendingGuides = async (req, res) => {
  try {
    const guides = await GuideProfile.find({ status: "pending" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

const getMyProfile = async (req, res) => {
  try {
    const email = normalizeEmail(req.headers["x-user-email"]);
    if (!email) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "guide") return res.status(403).json({ message: "Only guide accounts have a guide profile" });
    const profile = await GuideProfile.findOne({ userId: user._id }).populate("userId", "name email");
    if (!profile) return res.status(404).json({ message: "Guide profile not found" });
    const [pending, confirmed, completed] = await Promise.all([
      GuideBooking.countDocuments({ guideId: profile._id, status: "pending" }),
      GuideBooking.countDocuments({ guideId: profile._id, status: "confirmed" }),
      GuideBooking.countDocuments({ guideId: profile._id, status: "completed" }),
    ]);
    res.status(200).json({ ...profile.toObject(), bookingSummary: { pending, confirmed, completed } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getMyProfile = getMyProfile;