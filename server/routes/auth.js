const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controller/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", getMe);

module.exports = router;