import { Router } from "express";
import { getDMMessages, getGroupMessages, uploadFile } from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

const MessagesRoutes = Router();

MessagesRoutes.get("/dm/:contactId", verifyToken, getDMMessages);
MessagesRoutes.get("/group/:groupId", verifyToken, getGroupMessages);
MessagesRoutes.post("/upload", verifyToken, upload.single("file"), uploadFile);

export default MessagesRoutes;
