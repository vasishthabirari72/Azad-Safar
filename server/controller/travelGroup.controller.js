const mongoose = require("mongoose");
const TravelGroup = require("../models/TravelGroup");
const TripMessage = require("../models/TripMessage");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getTravelGroups = async (req, res) => {
  try {
    const { destination = "" } = req.query;
    const query = {};
    if (destination.trim()) {
      query.destination = { $regex: destination.trim(), $options: "i" };
    }
    const groups = await TravelGroup.find(query).sort({ createdAt: -1 });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTravelGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTravelGroup = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      totalCount,
      filledCount,
      hostName,
      hostEmail = "",
      hostInterest = "Adventure",
      hostRating = 4.8,
      hostVerified = true
    } = req.body;

    const total = Number(totalCount);
    const filled = Number(filledCount);

    if (!destination || !startDate || !endDate || !hostName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (Number.isNaN(total) || Number.isNaN(filled) || total < 2 || filled < 1 || filled > total) {
      return res.status(400).json({ message: "Invalid group size values" });
    }

    const group = await TravelGroup.create({
      destination: String(destination).trim(),
      startDate,
      endDate,
      totalCount: total,
      filledCount: filled,
      hostName: String(hostName).trim(),
      hostEmail: String(hostEmail).trim(),
      hostInterest,
      hostRating: Number(hostRating),
      hostVerified: Boolean(hostVerified)
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// NOTE: This route bypasses the join request flow entirely.
// It is kept for potential admin use only — the frontend uses createJoinRequest instead.
const joinTravelGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const updated = await TravelGroup.findOneAndUpdate(
      { _id: id, $expr: { $lt: ["$filledCount", "$totalCount"] } },
      { $inc: { filledCount: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Group is full or does not exist" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userEmail, userInterest = "Adventure" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    if (!String(userName || "").trim() || !normalizeEmail(userEmail)) {
      return res.status(400).json({ message: "Missing requester details" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (group.filledCount >= group.totalCount) {
      return res.status(409).json({ message: "Group is full" });
    }

    const requesterEmail = normalizeEmail(userEmail);
    const existing = group.joinRequests.find(
      (request) => normalizeEmail(request.userEmail) === requesterEmail
    );

    if (existing?.status === "pending") {
      return res.status(409).json({ message: "Join request already pending" });
    }

    if (existing?.status === "accepted") {
      return res.status(409).json({ message: "Already accepted in this group" });
    }

    if (existing?.status === "declined") {
      existing.status = "pending";
      existing.userName = String(userName).trim();
      existing.userEmail = String(userEmail).trim();
      existing.userInterest = userInterest;
      existing.respondedAt = null;
    } else {
      group.joinRequests.push({
        userName: String(userName).trim(),
        userEmail: String(userEmail).trim(),
        userInterest
      });
    }

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewJoinRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { action, hostEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid review action" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (normalizeEmail(group.hostEmail) !== normalizeEmail(hostEmail)) {
      return res.status(403).json({ message: "Only host can review requests" });
    }

    const requestItem = group.joinRequests.id(requestId);
    if (!requestItem) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (requestItem.status !== "pending") {
      return res.status(409).json({ message: "Request already reviewed" });
    }

    if (action === "accept") {
      if (group.filledCount >= group.totalCount) {
        return res.status(409).json({ message: "Group is full" });
      }
      requestItem.status = "accepted";
      group.filledCount += 1;
    } else {
      requestItem.status = "declined";
    }

    requestItem.respondedAt = new Date();
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTravelGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostEmail, destination, startDate, endDate, totalCount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (normalizeEmail(group.hostEmail) !== normalizeEmail(hostEmail)) {
      return res.status(403).json({ message: "Only host can edit group" });
    }

    if (destination) group.destination = String(destination).trim();
    if (startDate) group.startDate = startDate;
    if (endDate) group.endDate = endDate;

    if (totalCount !== undefined) {
      const total = Number(totalCount);
      if (Number.isNaN(total) || total < Math.max(group.filledCount, 2)) {
        return res.status(400).json({ message: "Total count cannot be below filled seats" });
      }
      group.totalCount = total;
    }

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeAcceptedMember = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { hostEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (normalizeEmail(group.hostEmail) !== normalizeEmail(hostEmail)) {
      return res.status(403).json({ message: "Only host can remove members" });
    }

    const requestItem = group.joinRequests.id(requestId);
    if (!requestItem) {
      return res.status(404).json({ message: "Member request not found" });
    }

    if (requestItem.status !== "accepted") {
      return res.status(409).json({ message: "Only accepted members can be removed" });
    }

    requestItem.status = "declined";
    requestItem.respondedAt = new Date();

    // FIX: recalculate from actual accepted count instead of blind decrement
    const acceptedCount = group.joinRequests.filter(
      (r) => r.status === "accepted" && String(r._id) !== String(requestItem._id)
    ).length;
    group.filledCount = acceptedCount + 1; // +1 for the host

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveTravelGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const email = normalizeEmail(userEmail);
    if (!email) {
      return res.status(400).json({ message: "Missing traveler email" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (normalizeEmail(group.hostEmail) === email) {
      return res.status(409).json({ message: "Host cannot leave hosted trip" });
    }

    const requestItem = group.joinRequests.find(
      (request) => normalizeEmail(request.userEmail) === email
    );

    if (!requestItem) {
      return res.status(404).json({ message: "You are not part of this trip" });
    }

    if (requestItem.status !== "accepted") {
      return res.status(409).json({ message: "Only accepted travelers can leave" });
    }

    requestItem.status = "declined";
    requestItem.respondedAt = new Date();

    // FIX: recalculate from actual accepted count instead of blind decrement
    const acceptedCount = group.joinRequests.filter(
      (r) => r.status === "accepted" && String(r._id) !== String(requestItem._id)
    ).length;
    group.filledCount = acceptedCount + 1; // +1 for the host

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTravelGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await TravelGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group does not exist" });
    }

    if (normalizeEmail(group.hostEmail) !== normalizeEmail(hostEmail)) {
      return res.status(403).json({ message: "Only host can delete group" });
    }

    await TravelGroup.findByIdAndDelete(id);
    res.status(200).json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTripMessages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const messages = await TripMessage.find({ tripId: id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json(
      messages.map((item) => ({
        tripId: String(item.tripId),
        userName: item.userName,
        message: item.message,
        timestamp: item.createdAt.toISOString(),
        messageId: String(item._id)
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTravelGroups,
  getTravelGroup,
  createTravelGroup,
  updateTravelGroup,
  joinTravelGroup,
  createJoinRequest,
  reviewJoinRequest,
  removeAcceptedMember,
  leaveTravelGroup,
  deleteTravelGroup,
  getTripMessages
};
