const express = require("express");
const router = express.Router();

const {
  getTravelGroups,
  createTravelGroup,
  updateTravelGroup,
  joinTravelGroup,
  createJoinRequest,
  reviewJoinRequest,
  removeAcceptedMember,
  deleteTravelGroup,
  getTripMessages
} = require("../controller/travelGroup.controller");

router.get("/", getTravelGroups);
router.post("/", createTravelGroup);
router.patch("/:id", updateTravelGroup);
router.post("/:id/join", joinTravelGroup);
router.post("/:id/request", createJoinRequest);
router.patch("/:id/requests/:requestId", reviewJoinRequest);
router.patch("/:id/requests/:requestId/remove", removeAcceptedMember);
router.delete("/:id", deleteTravelGroup);
router.get("/:id/messages", getTripMessages);

module.exports = router;
