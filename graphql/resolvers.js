import User from "../models/UserModel.js";
import Post from "../models/Post.js";
import FriendRequest from "../models/FriendRequest.js";
import { emitToUser } from "../socket.js";
import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import Comment from "../models/Comment.js";

const getIdString = (value) => {
  if (!value) return "";
  return (value._id || value).toString();
};

const userPublicFields = "_id email firstName lastName image color profileSetup";

export const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) return null;
      return await User.findById(userId);
    },
    getFeed: async (_, __, { userId }) => {
      if (!userId) return [];
      const user = await User.findById(userId).select("friends");
      if (!user) return [];
      return await Post.find({ author: { $in: [userId, ...user.friends] } })
        .populate("author")
        .populate({
          path: "comments",
          populate: { path: "author" },
        })
        .populate("likes")
        .sort({ createdAt: -1 })
        .limit(50);
    },
    getFriends: async (_, __, { userId }) => {
      if (!userId) return [];
      const user = await User.findById(userId).populate("friends", userPublicFields);
      if (!user) return [];
      return user.friends;
    },
    getAllUsers: async (_, __, { userId }) => {
      if (!userId) return [];
      return await User.find({ _id: { $ne: userId } }).select(userPublicFields).sort({
        firstName: 1,
        lastName: 1,
        email: 1,
      });
    },
    getPendingRequests: async (_, __, { userId }) => {
      if (!userId) return [];
      return await FriendRequest.find({
        receiver: userId,
        status: "pending",
      }).populate("sender receiver", userPublicFields);
    },
    getTasks: async (_, __, { userId }) => {
      if (!userId) return [];
      return await Task.find({ user: userId }).sort({ updatedAt: -1 });
    },
    getGroups: async (_, __, { userId }) => {
      if (!userId) return [];
      return await Group.find({
        $or: [{ admin: userId }, { members: userId }],
      }).populate("admin members");
    },
    getDirectMessages: async (_, { userId: otherUserId }, { userId }) => {
      if (!userId) return [];
      return await Message.find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      }).populate("sender receiver");
    },
    getGroupMessages: async (_, { groupId }, { userId }) => {
      if (!userId) return [];
      return await Message.find({ groupId }).populate("sender");
    },
    searchUsers: async (_, { q }, { userId }) => {
      if (!userId || q.trim().length < 2) return [];
      const searchRegex = { $regex: q.trim(), $options: "i" };
      return await User.find({
        _id: { $ne: userId },
        $or: [{ email: searchRegex }, { firstName: searchRegex }, { lastName: searchRegex }],
      }).select(userPublicFields);
    },
  },
  Mutation: {
    sendFriendRequest: async (_, { receiverId }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      if (receiverId === userId) throw new Error("Cannot send friend request to yourself");

      const sender = await User.findById(userId);
      if (!sender) throw new Error("User not found");

      const receiver = await User.findById(receiverId).select("_id");
      if (!receiver) throw new Error("Receiver not found");

      if (sender.friends.some((f) => f.toString() === receiverId)) {
        throw new Error("Already friends");
      }

      const existing = await FriendRequest.findOne({
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
        status: "pending",
      });
      if (existing) throw new Error("Friend request already exists");

      const request = await FriendRequest.create({
        sender: userId,
        receiver: receiverId,
      });

      const populatedRequest = await FriendRequest.findById(request._id).populate(
        "sender receiver",
        userPublicFields
      );
      emitToUser(receiverId, "newFriendRequest", populatedRequest);

      return populatedRequest;
    },
    createPost: async (_, { content }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      const post = await Post.create({
        author: userId,
        content: content.trim(),
      });
      return await post.populate("author");
    },
    togglePostLike: async (_, { postId }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");

      const post = await Post.findById(postId);
      if (!post) throw new Error("Post not found");

      const likeIndex = post.likes.findIndex((like) => getIdString(like) === userId);
      if (likeIndex === -1) {
        post.likes.push(userId);
      } else {
        post.likes.splice(likeIndex, 1);
      }

      await post.save();
      return await post.populate([
        { path: "author" },
        { path: "likes" },
        { path: "comments", populate: { path: "author" } },
      ]);
    },
    createComment: async (_, { postId, content }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      if (!content || !content.trim()) throw new Error("Comment content is required");

      const post = await Post.findById(postId);
      if (!post) throw new Error("Post not found");

      const comment = await Comment.create({
        author: userId,
        content: content.trim(),
      });

      post.comments.push(comment._id);
      await post.save();

      return await comment.populate("author");
    },
    acceptFriendRequest: async (_, { requestId }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      const request = await FriendRequest.findOne({
        _id: requestId,
        receiver: userId,
        status: "pending",
      });

      if (!request) throw new Error("Friend request not found");

      request.status = "accepted";
      await request.save();

      await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } });
      await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } });

      const me = await User.findById(userId).select("firstName email");
      emitToUser(request.sender.toString(), "friendRequestAccepted", {
        friendId: userId,
        friendName: me.firstName || me.email
      });

      return "Friend request accepted";
    },
    rejectFriendRequest: async (_, { requestId }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      const request = await FriendRequest.findOneAndDelete({
        _id: requestId,
        receiver: userId,
        status: "pending",
      });

      if (!request) throw new Error("Friend request not found");

      return "Friend request rejected";
    },
    createTask: async (_, { title }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      return await Task.create({
        user: userId,
        title: title.trim(),
      });
    },
    updateTaskStatus: async (_, { taskId, status }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      return await Task.findOneAndUpdate(
        { _id: taskId, user: userId },
        { status },
        { new: true }
      );
    },
    deleteTask: async (_, { taskId }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      await Task.findOneAndDelete({ _id: taskId, user: userId });
      return "Task deleted";
    },
    createGroup: async (_, { name, members }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      const group = await Group.create({
        name: name.trim(),
        admin: userId,
        members: [...members, userId],
      });
      return await group.populate("admin members");
    },
  },
  // Map _id to id for GraphQL compatibility if needed, 
  // though many setups handle this automatically.
  User: {
    id: (user) => user._id.toString(),
  },
  Post: {
    id: (post) => post._id.toString(),
    likesCount: (post) => post.likes?.length || 0,
    isLiked: (post, _, { userId }) => {
      if (!userId) return false;
      return Boolean(post.likes?.some((like) => getIdString(like) === userId));
    },
  },
  FriendRequest: {
    id: (req) => req._id.toString(),
  },
  Task: {
    id: (task) => task._id.toString(),
  },
  Group: {
    id: (group) => group._id.toString(),
  },
  Message: {
    id: (msg) => msg._id.toString(),
  },
  Comment: {
    id: (comment) => comment._id.toString(),
  },
};
