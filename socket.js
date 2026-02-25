import { Server } from "socket.io";
import Message from "./models/Message.js";

// Maps userId (string) → socket.id so we can reach specific users for call signaling
const userSocketMap = {};
let ioInstance = null;

const getRoomId = (userId1, userId2) =>
  `dm_${[userId1, userId2].sort().join("_")}`;

/**
 * emitToUser — helper to send an event to a specific user's socket
 */
export const emitToUser = (userId, event, data) => {
  const socketId = userSocketMap[userId];
  if (socketId && ioInstance) {
    ioInstance.to(socketId).emit(event, data);
  }
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigin = process.env.ORIGIN === "*" ? origin : process.env.ORIGIN;
        callback(null, allowedOrigin);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    // ─── JOIN ROOM ───────────────────────────────────────────────────
    // Client calls this when opening a DM or group chat.
    // roomId is either dm_id1_id2 (sorted) or group_<groupId>
    socket.on("joinRoom", ({ roomId }) => {
      socket.join(roomId);
    });

    // ─── SEND MESSAGE (DM or Group) ──────────────────────────────────
    // Payload: { roomId, message: { senderId, receiverId?, groupId?, content, messageType, fileUrl? } }
    socket.on("sendMessage", async ({ roomId, message }) => {
      try {
        const saved = await Message.create({
          sender: message.senderId,
          receiver: message.receiverId || null,
          groupId: message.groupId || null,
          messageType: message.messageType || "text",
          content: message.content || "",
          fileUrl: message.fileUrl || null,
        });

        const populated = await saved.populate("sender", "_id email firstName lastName image color");

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("receiveMessage", populated);
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    // ─── WEBRTC SIGNALING ────────────────────────────────────────────
    // callUser: caller → callee
    // Payload: { to: userId, from: { id, firstName, lastName }, offer: RTCSessionDescription }
    socket.on("callUser", ({ to, from, offer }) => {
      const targetSocket = userSocketMap[to];
      if (targetSocket) {
        io.to(targetSocket).emit("incomingCall", { from, offer });
      }
    });

    // answerCall: callee → caller
    // Payload: { to: userId, answer: RTCSessionDescription }
    socket.on("answerCall", ({ to, answer }) => {
      const targetSocket = userSocketMap[to];
      if (targetSocket) {
        io.to(targetSocket).emit("callAccepted", { answer });
      }
    });

    // iceCandidate: relay ICE candidates between peers
    // Payload: { to: userId, candidate: RTCIceCandidate }
    socket.on("iceCandidate", ({ to, candidate }) => {
      const targetSocket = userSocketMap[to];
      if (targetSocket) {
        io.to(targetSocket).emit("iceCandidate", { candidate });
      }
    });

    // endCall: notify the remote peer that the call ended
    // Payload: { to: userId }
    socket.on("endCall", ({ to }) => {
      const targetSocket = userSocketMap[to];
      if (targetSocket) {
        io.to(targetSocket).emit("callEnded");
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (userId && userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }
    });
  });

  return io;
};
