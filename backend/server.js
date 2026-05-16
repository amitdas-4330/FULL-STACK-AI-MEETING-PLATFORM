const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

const server = http.createServer(app);

// ======================================================
// ================= SOCKET.IO ==========================
// ======================================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ======================================================
// ================= DATABASE ===========================
// ======================================================

connectDB();

// ======================================================
// ================= MIDDLEWARE =========================
// ======================================================

app.use(cors());

app.use(express.json());

// ======================================================
// ================= ROUTES =============================
// ======================================================

app.use("/api/auth", authRoutes);

// ======================================================
// ================= TEST ROUTE =========================
// ======================================================

app.get("/", (req, res) => {

  res.send("AI Meeting Backend Running");

});

// ======================================================
// ================= ROOM STORAGE =======================
// ======================================================

const meetingUsers = {};

const roomMessages = {};

const roomAttendance = {};

const roomTranscripts = {};

const roomSummaries = {};

const roomSettings = {};

const AI_SERVER_URL =
  process.env.AI_SERVER_URL || "http://localhost:8000";

const DEFAULT_ATTENDANCE_MINUTES = 10;

const ensureRoom = (roomId) => {

  if (!meetingUsers[roomId]) {
    meetingUsers[roomId] = [];
  }

  if (!roomMessages[roomId]) {
    roomMessages[roomId] = [];
  }

  if (!roomAttendance[roomId]) {
    roomAttendance[roomId] = [];
  }

  if (!roomTranscripts[roomId]) {
    roomTranscripts[roomId] = [];
  }

  if (!roomSummaries[roomId]) {
    roomSummaries[roomId] = [];
  }

  if (!roomSettings[roomId]) {
    roomSettings[roomId] = {
      hostSocketId: null,
      attendanceThresholdMinutes:
        DEFAULT_ATTENDANCE_MINUTES,
    };
  }

};

const calculateAttendance = (roomId) => {

  ensureRoom(roomId);

  const threshold =
    roomSettings[roomId].attendanceThresholdMinutes;

  roomAttendance[roomId] =
    roomAttendance[roomId].map((user) => {

      const elapsedMinutes =
        (Date.now() - user.joinTime) / 1000 / 60;

      return {
        ...user,
        elapsedMinutes:
          Number(elapsedMinutes.toFixed(1)),
        present:
          elapsedMinutes >= threshold,
      };

    });

  return roomAttendance[roomId];

};

const emitAttendance = (roomId) => {

  io.to(roomId).emit(
    "attendance-update",
    calculateAttendance(roomId)
  );

};

const emitMeetingSettings = (roomId) => {

  ensureRoom(roomId);

  meetingUsers[roomId].forEach((user) => {

    io.to(user.socketId).emit(
      "meeting-settings",
      {
        ...roomSettings[roomId],
        isHost:
          user.socketId ===
          roomSettings[roomId].hostSocketId,
      }
    );

  });

};

const readAiError = async (response) => {

  try {

    const body = await response.json();

    return (
      body.error ||
      body.message ||
      `AI server returned ${response.status}`
    );

  } catch {

    return `AI server returned ${response.status}`;

  }

};

const attendanceInterval = setInterval(() => {

  for (const roomId in roomAttendance) {
    emitAttendance(roomId);
  }

}, 30000);

// ======================================================
// ================= SOCKET CONNECTION ==================
// ======================================================

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  // ======================================================
  // ================= JOIN MEETING =======================
  // ======================================================

  socket.on("join-meeting", (data) => {

    const {
      roomId,
      user,
    } = data;

    // JOIN ROOM

    socket.join(roomId);

    ensureRoom(roomId);

    if (!roomSettings[roomId].hostSocketId) {
      roomSettings[roomId].hostSocketId = socket.id;
    }

    if (!socket.data.rooms) {
      socket.data.rooms = new Set();
    }

    socket.data.rooms.add(roomId);

    // CHECK USER

    const alreadyExists =
      meetingUsers[roomId].find(
        (u) => u.socketId === socket.id
      );

    // ADD USER

    if (!alreadyExists) {

      const userData = {
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        joinTime: Date.now(),
        isPresent: false,
        isHost:
          socket.id ===
          roomSettings[roomId].hostSocketId,
      };

      meetingUsers[roomId].push(userData);

      roomAttendance[roomId].push({
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        joinTime: Date.now(),
        elapsedMinutes: 0,
        present: false,
      });

    }

    // SEND USERS

    io.to(roomId).emit(
      "meeting-users",
      meetingUsers[roomId]
    );

    // SEND CHAT HISTORY

    io.to(socket.id).emit(
      "chat-history",
      roomMessages[roomId]
    );

    io.to(socket.id).emit(
      "transcript-history",
      roomTranscripts[roomId]
    );

    io.to(socket.id).emit(
      "summary-history",
      roomSummaries[roomId]
    );

    emitMeetingSettings(roomId);
    emitAttendance(roomId);

    console.log(
      `${user.name} joined room ${roomId}`
    );

  });

  // ======================================================
  // ================= CHAT SYSTEM ========================
  // ======================================================

  socket.on("send-message", (data) => {

    const {
      roomId,
      message,
      sender,
    } = data;

    ensureRoom(roomId);

    const newMessage = {
      id: Date.now(),
      sender,
      message,
      time: new Date().toLocaleTimeString(),
    };

    // SAVE MESSAGE

    roomMessages[roomId].push(newMessage);

    // SEND MESSAGE

    io.to(roomId).emit(
      "receive-message",
      newMessage
    );

  });

  // ======================================================
  // ================= LIVE TRANSCRIPT ====================
  // ======================================================

  socket.on("live-transcript", (data) => {

    const {
      roomId,
      speaker,
      transcript,
    } = data;

    ensureRoom(roomId);

    const transcriptItem = {
      id: Date.now(),
      speaker,
      transcript,
      language: data.language || "unknown",
      time: new Date().toLocaleTimeString(),
    };

    roomTranscripts[roomId].push(transcriptItem);

    io.to(roomId).emit(
      "receive-transcript",
      transcriptItem
    );

  });

  // ======================================================
  // ================= AUDIO TO AI SERVER =================
  // ======================================================

  socket.on("audio-chunk", async (data) => {

    try {

      const {
        roomId,
        audioChunk,
        mimeType,
        speaker,
        userId,
      } = data;

      ensureRoom(roomId);

      if (!audioChunk) {
        return;
      }

      const buffer = Buffer.from(audioChunk);

      if (!buffer.length) {
        return;
      }

      const formData = new FormData();

      formData.append(
        "audio",
        new Blob(
          [buffer],
          {
            type:
              mimeType ||
              "audio/webm",
          }
        ),
        "meeting-audio.webm"
      );

      formData.append("roomId", roomId);
      formData.append("speaker", speaker || "Unknown");
      formData.append("userId", userId || "");

      const response = await fetch(
        `${AI_SERVER_URL}/audio-chunk`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          await readAiError(response)
        );
      }

      const result = await response.json();

      if (!result.transcript) {
        return;
      }

      const transcriptItem = {
        id: Date.now(),
        speaker:
          result.speaker ||
          speaker ||
          "Unknown",
        userId: userId || "",
        transcript: result.transcript,
        language:
          result.language ||
          "unknown",
        confidence:
          result.confidence ||
          null,
        time: new Date().toLocaleTimeString(),
      };

      roomTranscripts[roomId].push(transcriptItem);

      io.to(roomId).emit(
        "receive-transcript",
        transcriptItem
      );

    } catch (error) {

      socket.emit(
        "ai-error",
        {
          message:
            error.message ||
            "Audio transcription failed",
        }
      );

    }

  });

  // ======================================================
  // ================= AI SUMMARY =========================
  // ======================================================

  socket.on("meeting-summary", (data) => {

    const {
      roomId,
      summary,
    } = data;

    ensureRoom(roomId);

    const summaryItem = {
      id: Date.now(),
      summary,
      createdAt: new Date(),
    };

    roomSummaries[roomId].push(summaryItem);

    io.to(roomId).emit(
      "receive-summary",
      summaryItem
    );

  });

  socket.on("generate-meeting-summary", async (data) => {

    try {

      const { roomId } = data;

      ensureRoom(roomId);

      const response = await fetch(
        `${AI_SERVER_URL}/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript:
              roomTranscripts[roomId],
            attendance:
              calculateAttendance(roomId),
            attendanceThresholdMinutes:
              roomSettings[roomId]
                .attendanceThresholdMinutes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readAiError(response)
        );
      }

      const result = await response.json();

      const summaryItem = {
        id: Date.now(),
        summary: result.summary,
        createdAt: new Date(),
      };

      roomSummaries[roomId].push(summaryItem);

      io.to(roomId).emit(
        "receive-summary",
        summaryItem
      );

    } catch (error) {

      socket.emit(
        "ai-error",
        {
          message:
            error.message ||
            "Summary generation failed",
        }
      );

    }

  });

  // ======================================================
  // ================= WEBRTC SIGNALING ===================
  // ======================================================

  socket.on("sending-signal", (data) => {

    io.to(data.userToSignal).emit(
      "user-joined",
      {
        signal: data.signal,
        callerId: data.callerId,
        name: data.name,
      }
    );

  });

  socket.on("returning-signal", (data) => {

    io.to(data.callerId).emit(
      "receiving-returned-signal",
      {
        signal: data.signal,
        id: socket.id,
      }
    );

  });

  // ======================================================
  // ================= ATTENDANCE SYSTEM ==================
  // ======================================================

  socket.on("update-attendance-threshold", (data) => {

    const {
      roomId,
      minutes,
    } = data;

    ensureRoom(roomId);

    if (
      roomSettings[roomId].hostSocketId !==
      socket.id
    ) {
      socket.emit(
        "attendance-error",
        {
          message:
            "Only the host can update attendance time",
        }
      );
      return;
    }

    const parsedMinutes = Number(minutes);

    if (
      Number.isNaN(parsedMinutes) ||
      parsedMinutes <= 0 ||
      parsedMinutes > 60
    ) {
      socket.emit(
        "attendance-error",
        {
          message:
            "Attendance time must be between 1 and 60 minutes",
        }
      );
      return;
    }

    roomSettings[roomId].attendanceThresholdMinutes =
      parsedMinutes;

    emitMeetingSettings(roomId);
    emitAttendance(roomId);

  });

  // ======================================================
  // ================= DISCONNECT =========================
  // ======================================================

  socket.on("disconnect", () => {

    // REMOVE USER FROM ROOMS

    for (const roomId in meetingUsers) {

      meetingUsers[roomId] =
        meetingUsers[roomId].filter(
          (u) => u.socketId !== socket.id
        );

      roomAttendance[roomId] =
        roomAttendance[roomId].filter(
          (u) => u.socketId !== socket.id
        );

      if (
        roomSettings[roomId] &&
        roomSettings[roomId].hostSocketId ===
          socket.id
      ) {
        roomSettings[roomId].hostSocketId =
          meetingUsers[roomId][0]?.socketId ||
          null;
      }

      // UPDATE USERS

      io.to(roomId).emit(
        "meeting-users",
        meetingUsers[roomId]
      );

      emitMeetingSettings(roomId);
      emitAttendance(roomId);

    }

    console.log(
      "User Disconnected:",
      socket.id
    );

  });

});

// ======================================================
// ================= START SERVER =======================
// ======================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
