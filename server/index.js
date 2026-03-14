const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const placesRoute = require("./routes/places");
const travelGroupsRoute = require("./routes/travelGroups");
const authRoute = require("./routes/auth");
const guidesRoute = require("./routes/guides");

const TripMessage = require("./models/TripMessage");
const TravelGroup = require("./models/TravelGroup");

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/places", placesRoute);
app.use("/api/travel-groups", travelGroupsRoute);
app.use("/api/auth", authRoute);
app.use("/api/guides", guidesRoute);

// FIX: Added userEmail to socket message so frontend can identify "mine" messages reliably
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join-trip-chat", ({ tripId }) => {
    if (!tripId) return;
    socket.join(`trip:${tripId}`);
  });

  socket.on("trip-message", async ({ tripId, message, userName, userEmail }) => {
    if (!tripId || !message || !String(message).trim()) return;

    try {
      const group = await TravelGroup.findById(tripId).select("_id");
      if (!group) return;

      const saved = await TripMessage.create({
        tripId: group._id,
        userName: String(userName || "Traveler").trim(),
        message: String(message).trim()
      });

      io.to(`trip:${tripId}`).emit("trip-message", {
        tripId,
        message: saved.message,
        userName: saved.userName,
        // FIX: pass userEmail back so frontend .mine detection works correctly
        userEmail: String(userEmail || "").trim().toLowerCase(),
        timestamp: saved.createdAt.toISOString(),
        messageId: String(saved._id)
      });
    } catch (error) {
      console.error("trip-message failed:", error.message);
    }
  });

  // Guide-traveler direct chat
  socket.on("join-guide-chat", ({ guideId, travelerId }) => {
    if (!guideId || !travelerId) return;
    socket.join(`guide:${guideId}:traveler:${travelerId}`);
  });

  socket.on("guide-message", async ({ guideId, travelerId, senderRole, message }) => {
    if (!guideId || !travelerId || !message || !String(message).trim()) return;
    try {
      const GuideMessage = require("./models/GuideMessage");
      const saved = await GuideMessage.create({
        guideId,
        travelerId,
        senderRole: senderRole || "traveler",
        message: String(message).trim(),
      });
      const room = `guide:${guideId}:traveler:${travelerId}`;
      io.to(room).emit("guide-message", {
        guideId,
        travelerId,
        senderRole: saved.senderRole,
        message: saved.message,
        timestamp: saved.createdAt.toISOString(),
        messageId: String(saved._id),
      });
    } catch (error) {
      console.error("guide-message failed:", error.message);
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const port = process.env.PORT || 8000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });