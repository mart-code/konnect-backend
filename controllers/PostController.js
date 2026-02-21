import Post from "../models/Post.js";
import User from "../models/UserModel.js";

// Get friend feed: posts authored by any of the user's friends
export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("friends");

    const posts = await Post.find({ author: { $in: user.friends } })
      .populate("author", "_id email firstName lastName image color")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const post = await Post.create({
      author: req.userId,
      content: content.trim(),
    });

    const populated = await post.populate("author", "_id email firstName lastName image color");

    return res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
