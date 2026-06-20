const express = require("express");
const router = express.Router();

const {
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
} = require("../controller/travelGroup.controller");

router.get("/", getTravelGroups);
router.get("/:id", getTravelGroup);
router.post("/", createTravelGroup);
router.patch("/:id", updateTravelGroup);
router.post("/:id/join", joinTravelGroup);
router.post("/:id/request", createJoinRequest);
router.patch("/:id/requests/:requestId", reviewJoinRequest);
router.patch("/:id/requests/:requestId/remove", removeAcceptedMember);
router.patch("/:id/leave", leaveTravelGroup);
router.delete("/:id", deleteTravelGroup);
router.get("/:id/messages", getTripMessages);

module.exports = router;
