const User = require("../models/User");
const GuideProfile = require("../models/GuideProfile");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

/* =====================
   POST /api/auth/signup
   Body: { name, email, password, role, interest,
           // guide-only fields:
           bio, photo, languages, pricePerDay, experienceYears, cities, states }
===================== */
const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "traveler",
      interest = "Adventure",
      // guide profile fields
      bio = "",
      photo = "",
      languages = [],
      pricePerDay,
      experienceYears = 0,
      cities = [],
      states = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!["traveler", "guide"].includes(role)) {
      return res.status(400).json({ message: "Role must be traveler or guide" });
    }

    if (role === "guide" && (!pricePerDay || Number(pricePerDay) < 0)) {
      return res.status(400).json({ message: "Guides must set a valid price per day" });
    }

    const existingUser = await User.findOne({ email: normalizeEmail(email) });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // NOTE: In production you must hash the password (bcrypt).
    // For now storing plain text to match the existing localStorage pattern.
    // When you add bcrypt: const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizeEmail(email),
      password: String(password),
      role,
      interest,
    });

    // If registering as a guide, create their profile immediately
    // Status is "pending" — they won't appear in search until approved
    if (role === "guide") {
      await GuideProfile.create({
        userId: user._id,
        bio: String(bio).trim(),
        photo: String(photo).trim(),
        languages: Array.isArray(languages) ? languages : [],
        pricePerDay: Number(pricePerDay),
        experienceYears: Number(experienceYears) || 0,
        cities: Array.isArray(cities) ? cities : [],
        states: Array.isArray(states) ? states : [],
        status: "pending",
      });
    }

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        interest: user.interest,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   POST /api/auth/login
   Body: { email, password }
===================== */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Plain text comparison for now — replace with bcrypt.compare when you add hashing
    if (user.password !== String(password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If user is a guide, include their profile status
    let guideProfileId = null;
    let guideStatus = null;
    if (user.role === "guide") {
      const profile = await GuideProfile.findOne({ userId: user._id }).select("_id status");
      if (profile) {
        guideProfileId = String(profile._id);
        guideStatus = profile.status;
      }
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        interest: user.interest,
        guideProfileId,
        guideStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================
   GET /api/auth/me
   Header: x-user-email (simple auth for now)
===================== */
const getMe = async (req, res) => {
  try {
    const email = normalizeEmail(req.headers["x-user-email"]);
    if (!email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let guideProfileId = null;
    let guideStatus = null;
    if (user.role === "guide") {
      const profile = await GuideProfile.findOne({ userId: user._id }).select("_id status");
      if (profile) {
        guideProfileId = String(profile._id);
        guideStatus = profile.status;
      }
    }

    res.status(200).json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      interest: user.interest,
      guideProfileId,
      guideStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login, getMe };