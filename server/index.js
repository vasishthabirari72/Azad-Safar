const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const placesRoute = require("./routes/places");
const travelGroupsRoute = require("./routes/travelGroups");
const TripMessage = require("./models/TripMessage");
const TravelGroup = require("./models/TravelGroup");

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(express.json());

app.use("/api/places", placesRoute);
app.use("/api/travel-groups", travelGroupsRoute);

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

  socket.on("trip-message", async ({ tripId, message, userName }) => {
    if (!tripId || !message) return;

    try {
      const group = await TravelGroup.findById(tripId).select("_id");
      if (!group) return;

      const saved = await TripMessage.create({
        tripId: group._id,
        userName: String(userName || "Traveler"),
        message: String(message).trim()
      });

      io.to(`trip:${tripId}`).emit("trip-message", {
        tripId,
        message: saved.message,
        userName: saved.userName,
        timestamp: saved.createdAt.toISOString(),
        messageId: String(saved._id),
        socketId: socket.id
      });
    } catch (error) {
      console.error("trip-message failed:", error.message);
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
  .catch(err => {
    console.error("MongoDB connection failed:", err);
  });
 

