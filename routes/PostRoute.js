import { Router } from "express";
import { getFeed, createPost } from "../controllers/PostController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const PostRoutes = Router();

PostRoutes.get("/feed", verifyToken, getFeed);
PostRoutes.post("/", verifyToken, createPost);

export default PostRoutes;
