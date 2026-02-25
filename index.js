import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import AuthRoutes from "./routes/AuthRoute.js";
import ContactRoutes from "./routes/ContactRoute.js";
import PostRoutes from "./routes/PostRoute.js";
import MessagesRoutes from "./routes/MessagesRoute.js";
import GroupRoutes from "./routes/GroupRoute.js";
import TaskRoutes from "./routes/TaskRoute.js";
import { initSocket } from "./socket.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const databaseUrl = process.env.DATABASE_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigin = process.env.ORIGIN === "*" ? origin : process.env.ORIGIN;
      callback(null, allowedOrigin);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/auth", AuthRoutes);
app.use("/api/contacts", ContactRoutes);
app.use("/api/posts", PostRoutes);
app.use("/api/messages", MessagesRoutes);
app.use("/api/groups", GroupRoutes);
app.use("/api/tasks", TaskRoutes);

// ─── GRAPHQL ─────────────────────────────────────────────────────────────────
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.cookies.jwt;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_KEY);
          return { userId: payload.userId };
        } catch (err) {
          // Invalid token, context will have no userId
        }
      }
      return {};
    },
  })
);

app.get("/", (_req, res) => {
  res.send("Konnect API is running.");
});

// ─── HTTP SERVER + SOCKET.IO ─────────────────────────────────────────────────
// We wrap express in an http.Server so socket.io can share the same port.
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// ─── DATABASE ─────────────────────────────────────────────────────────────────
mongoose
  .connect(databaseUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(`FAILURE: Could not connect to MongoDB. Check your IP whitelist and DATABASE_URL.\nError: ${err.message}`);
  });
