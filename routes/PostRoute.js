import { Router } from "express";
import { createPost, getFeed, getPostLikes, togglePostLike } from "../controllers/PostController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const PostRoutes = Router();

PostRoutes.get("/feed", verifyToken, getFeed);
PostRoutes.post("/", verifyToken, createPost);
PostRoutes.get("/:postId/likes", verifyToken, getPostLikes);
PostRoutes.post("/:postId/like", verifyToken, togglePostLike);

export default PostRoutes;
