import Task from "../models/Task.js";

// Get all tasks for the current user
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: 1 });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await Task.create({ user: req.userId, title: title.trim() });
    return res.status(201).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a task (title and/or status)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId },
      { ...(title && { title }), ...(status && { status }) },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
