const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("AI Meeting Backend Running");
});


// ================= SOCKET.IO =================

const meetingUsers = {};

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  // JOIN ROOM

  socket.on("join-meeting", (data) => {

    const {
      roomId,
      user,
    } = data;

    socket.join(roomId);

    if (!meetingUsers[roomId]) {
      meetingUsers[roomId] = [];
    }

    const alreadyExists = meetingUsers[roomId]
      .find((u) => u.socketId === socket.id);

    if (!alreadyExists) {

      meetingUsers[roomId].push({
        socketId: socket.id,
        userId: user._id,
        name: user.name,
        joinTime: Date.now(),
      });

    }

    io.to(roomId).emit(
      "meeting-users",
      meetingUsers[roomId]
    );

    console.log(`${user.name} joined ${roomId}`);

  });

  // LEAVE ROOM

  socket.on("disconnect", () => {

    for (const roomId in meetingUsers) {

      meetingUsers[roomId] =
        meetingUsers[roomId].filter(
          (u) => u.socketId !== socket.id
        );

      io.to(roomId).emit(
        "meeting-users",
        meetingUsers[roomId]
      );

    }

    console.log("User Disconnected:", socket.id);

  });

});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});