import Group from "../models/Group.js";

// List groups the current user is a member of
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate("members", "_id email firstName lastName image color")
      .populate("admin", "_id email firstName lastName");

    return res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a new group — creator becomes admin and a member
export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Always include the creator
    const members = [...new Set([req.userId, ...(memberIds || [])])];

    const group = await Group.create({
      name: name.trim(),
      admin: req.userId,
      members,
    });

    const populated = await group.populate([
      { path: "members", select: "_id email firstName lastName image color" },
      { path: "admin", select: "_id email firstName lastName" },
    ]);

    return res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
