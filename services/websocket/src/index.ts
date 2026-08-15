import "./load-env.js";
import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT) || 4001;
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "websocket" });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

/** Fans out ai-service's `chat:{sessionId}` publishes to the matching Socket.io room. */
const chatEventsSubscriber = pubClient.duplicate();
chatEventsSubscriber.psubscribe("chat:*");
chatEventsSubscriber.on("pmessage", (_pattern, channel, message) => {
  try {
    const event = JSON.parse(message);
    io.to(channel).emit("chat_event", event);
  } catch (err) {
    console.error(`[websocket] Failed to parse pub/sub message on ${channel}:`, err);
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) {
    next(new Error("Authentication required"));
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[websocket] client connected: ${socket.id}`);

  socket.on("join_session", (payload: { sessionId?: string }) => {
    const sessionId = payload?.sessionId;
    if (typeof sessionId !== "string" || !sessionId) return;
    socket.join(`chat:${sessionId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[websocket] client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Websocket service listening on port ${PORT}`);
});

const shutdown = async () => {
  io.close();
  await pubClient.quit();
  await subClient.quit();
  await chatEventsSubscriber.quit();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
