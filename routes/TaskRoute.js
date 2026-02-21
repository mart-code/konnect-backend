import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/TaskController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const TaskRoutes = Router();

TaskRoutes.get("/", verifyToken, getTasks);
TaskRoutes.post("/", verifyToken, createTask);
TaskRoutes.patch("/:id", verifyToken, updateTask);
TaskRoutes.delete("/:id", verifyToken, deleteTask);

export default TaskRoutes;
