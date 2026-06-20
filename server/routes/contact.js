const express = require("express");
const router  = express.Router();
const Contact = require("../models/Contact");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "All fields are required." });
    }

    await Contact.create({ name, email, subject, message });
    res.status(201).json({ message: "Message received! We'll get back to you shortly." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});

module.exports = router;
