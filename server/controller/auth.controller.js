const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const GuideProfile = require("../models/GuideProfile");

const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

function makeTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const SALT_ROUNDS = 10;

/* =====================
   POST /api/auth/signup
===================== */
const signup = async (req, res) => {
  try {
    const {
      name, email, password,
      role = "traveler", interest = "Adventure",
      bio = "", photo = "", languages = [],
      pricePerDay, experienceYears = 0,
      cities = [], states = [],
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

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizeEmail(email),
      password: hashedPassword,
      role,
      interest,
    });

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

    // Supports both bcrypt hashed passwords and legacy plain text
    // Plain text accounts get automatically upgraded on next login
    let passwordMatch = false;
    const isHashed = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

    if (isHashed) {
      passwordMatch = await bcrypt.compare(String(password), user.password);
    } else {
      // Legacy plain text comparison
      passwordMatch = user.password === String(password);
      if (passwordMatch) {
        // Upgrade to bcrypt hash silently
        user.password = await bcrypt.hash(String(password), SALT_ROUNDS);
        await user.save();
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
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
   Header: x-user-email
===================== */
const getMe = async (req, res) => {
  try {
    const email = normalizeEmail(req.headers["x-user-email"]);
    if (!email) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findOne({ email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

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

/* ================================
   POST /api/auth/forgot-password
   Body: { email }
================================ */
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always return 200 so we don't expose whether the email exists
    if (!user) return res.status(200).json({ message: "If that email exists, a reset link has been sent." });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);
    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(",")[0].trim()
      : "http://localhost:5173";
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

    const transporter = makeTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"Azaad Safar" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Reset your Azaad Safar password",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#0f172a">Reset your password</h2>
            <p>Hi ${user.name},</p>
            <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}"
               style="display:inline-block;margin:16px 0;padding:12px 24px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">
              Reset Password
            </a>
            <p style="color:#64748b;font-size:0.85rem">
              If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
            <p style="color:#94a3b8;font-size:0.75rem">Azaad Safar · India</p>
          </div>
        `,
      });
    } else {
      // Dev mode — no SMTP configured; log the link so you can test locally
      console.log(`[DEV] Password reset link for ${email}:\n${resetUrl}`);
    }

    res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   POST /api/auth/reset-password
   Body: { token, password }
================================ */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(String(password), SALT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login, getMe, forgotPassword, resetPassword };