const express = require("express");
const router = express.Router();
const { signup, login, getMe, forgotPassword, resetPassword } = require("../controller/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;