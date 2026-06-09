import Post from "../models/Post.js";
import User from "../models/UserModel.js";

const serializePost = (post, userId) => {
  const postObject = post.toObject ? post.toObject() : post;
  const likes = postObject.likes || [];
  const currentUserId = userId?.toString();

  return {
    ...postObject,
    likesCount: likes.length,
    isLiked: Boolean(
      currentUserId &&
        likes.some((like) => {
          const likeId = like?._id || like;
          return likeId?.toString() === currentUserId;
        })
    ),
  };
};

// Get friend feed: posts authored by any of the user's friends
export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("friends");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ author: { $in: [req.userId, ...user.friends] } })
      .populate("author", "_id email firstName lastName image color updatedAt")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(posts.map((post) => serializePost(post, req.userId)));
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

    const populated = await post.populate("author", "_id email firstName lastName image color timestamp");

    return res.status(201).json(serializePost(populated, req.userId));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Toggle the authenticated user's like on a post
export const togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likeIndex = post.likes.findIndex((like) => like.toString() === req.userId);
    if (likeIndex === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    await post.populate("author", "_id email firstName lastName image color updatedAt");

    return res.status(200).json(serializePost(post, req.userId));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the like count for a single post
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).select("likes");
    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json(serializePost(post, req.userId));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
