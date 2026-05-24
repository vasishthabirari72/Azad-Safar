const express = require("express");
const router = express.Router();
const { getGuides, updateGuideStatus, getStats } = require("../controller/admin.controller");

router.get("/stats", getStats);
router.get("/guides", getGuides);
router.patch("/guides/:id", updateGuideStatus);

module.exports = router;