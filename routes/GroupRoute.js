import { Router } from "express";
import { getMyGroups, createGroup } from "../controllers/GroupController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const GroupRoutes = Router();

GroupRoutes.get("/my-groups", verifyToken, getMyGroups);
GroupRoutes.post("/", verifyToken, createGroup);

export default GroupRoutes;
