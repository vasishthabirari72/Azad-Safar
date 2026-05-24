const GuideProfile = require("../models/GuideProfile");
const User = require("../models/User");
const GuideBooking = require("../models/GuideBooking");

// Simple password check — set ADMIN_PASSWORD in your .env file
// e.g. ADMIN_PASSWORD=azaadsafar_admin_2024
const checkAdmin = (req) => {
  const token = req.headers["x-admin-token"];
  return token && token === process.env.ADMIN_PASSWORD;
};

/* GET /api/admin/guides?status=pending|active|suspended */
const getGuides = async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).json({ message: "Admin access required" });
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const guides = await GuideProfile.find(filter)
      .populate("userId", "name email createdAt")
      .sort({ createdAt: -1 });
    res.status(200).json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* PATCH /api/admin/guides/:id — approve, suspend, or reactivate */
const updateGuideStatus = async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).json({ message: "Admin access required" });
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const guide = await GuideProfile.findByIdAndUpdate(
      id, { status }, { new: true }
    ).populate("userId", "name email");
    if (!guide) return res.status(404).json({ message: "Guide not found" });
    res.status(200).json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET /api/admin/stats — dashboard numbers */
const getStats = async (req, res) => {
  if (!checkAdmin(req)) return res.status(403).json({ message: "Admin access required" });
  try {
    const [
      totalUsers, totalGuides,
      pendingGuides, activeGuides,
      totalBookings, pendingBookings,
    ] = await Promise.all([
      User.countDocuments(),
      GuideProfile.countDocuments(),
      GuideProfile.countDocuments({ status: "pending" }),
      GuideProfile.countDocuments({ status: "active" }),
      GuideBooking.countDocuments(),
      GuideBooking.countDocuments({ status: "pending" }),
    ]);
    res.status(200).json({
      totalUsers, totalGuides,
      pendingGuides, activeGuides,
      totalBookings, pendingBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGuides, updateGuideStatus, getStats };