// File: backend/src/server.js
require("dotenv").config();

const validateEnvironment = require("./config/validateEnv");
validateEnvironment();

const { createServer } = require("http");
const { Server } = require("socket.io");
const createDOMPurify = require("isomorphic-dompurify");
const app = require("./app");

const server = createServer(app);
const DOMPurify = createDOMPurify();

let io = null;

if (process.env.NODE_ENV !== "test") {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:19006" },
  });

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-location", (locationData) => {
      try {
        const city = DOMPurify.sanitize(locationData.city || "");
        const state = DOMPurify.sanitize(locationData.state || "");
        if (city && state) {
          const locationRoom = `location-${city}-${state}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
          socket.join(locationRoom);
          console.log(`User ${socket.id} joined location room: ${locationRoom}`);
        }
      } catch (error) {
        console.error("Error joining location room:", error);
      }
    });

    socket.on("emergency-alert", (data) => {
      try {
        const cleanData = {
          city: DOMPurify.sanitize(data.city || ""),
          state: DOMPurify.sanitize(data.state || ""),
          title: DOMPurify.sanitize(data.title || ""),
          severity: DOMPurify.sanitize(data.severity || ""),
          alertType: DOMPurify.sanitize(data.alertType || ""),
          alertId: parseInt(data.alertId) || null,
          userId: parseInt(data.userId) || null,
        };
        if (cleanData.city && cleanData.state) {
          const locationRoom = `location-${cleanData.city}-${cleanData.state}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");
          socket.to(locationRoom).emit("emergency-alert", cleanData);
          console.log(`Emergency alert sent to location: ${cleanData.city}, ${cleanData.state}`);
        }
      } catch (error) {
        console.error("Error broadcasting emergency alert:", error);
      }
    });

    socket.on("new-post", (data) => {
      try {
        const cleanData = {
          city: DOMPurify.sanitize(data.city || ""),
          state: DOMPurify.sanitize(data.state || ""),
          postId: parseInt(data.postId) || null,
          title: DOMPurify.sanitize(data.title || ""),
          postType: DOMPurify.sanitize(data.postType || ""),
          isEmergency: Boolean(data.isEmergency),
          userId: parseInt(data.userId) || null,
        };
        if (cleanData.city && cleanData.state) {
          const locationRoom = `location-${cleanData.city}-${cleanData.state}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");
          socket.to(locationRoom).emit("new-post", cleanData);
          console.log(`New post sent to location: ${cleanData.city}, ${cleanData.state}`);
        }
      } catch (error) {
        console.error("Error broadcasting new post:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    if (process.env.NODE_ENV === "development") {
      console.log(`Analytics: http://localhost:${PORT}/analytics`);
      console.log(`Cache stats: http://localhost:${PORT}/cache/stats`);
    }
    console.log("Security: Enhanced headers and input sanitization enabled");
    console.log("Logging: Request tracking and performance monitoring enabled");
    console.log("Caching: Intelligent response caching system enabled");
    console.log("Socket.IO: Real-time features enabled");
  });
}

module.exports = { app, server, io };
