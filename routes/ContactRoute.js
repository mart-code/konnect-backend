import { Router } from "express";
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  rejectFriendRequest,
} from "../controllers/ContactController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const ContactRoutes = Router();

ContactRoutes.get("/search", verifyToken, searchUsers);
ContactRoutes.get("/friends", verifyToken, getFriends);
ContactRoutes.get("/requests", verifyToken, getPendingRequests);
ContactRoutes.post("/friend-request", verifyToken, sendFriendRequest);
ContactRoutes.post("/friend-request/:requestId/accept", verifyToken, acceptFriendRequest);
ContactRoutes.post("/friend-request/:requestId/reject", verifyToken, rejectFriendRequest);

export default ContactRoutes;
