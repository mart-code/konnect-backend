import User from "../models/UserModel.js";
import Post from "../models/Post.js";
import FriendRequest from "../models/FriendRequest.js";
import { emitToUser } from "../socket.js";

export const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) return null;
      return await User.findById(userId);
    },
    getFeed: async (_, __, { userId }) => {
      if (!userId) return [];
      const user = await User.findById(userId).select("friends");
      return await Post.find({ author: { $in: [userId, ...user.friends] } })
        .populate("author")
        .sort({ createdAt: -1 })
        .limit(50);
    },
    getFriends: async (_, __, { userId }) => {
      if (!userId) return [];
      const user = await User.findById(userId).populate("friends");
      return user.friends;
    },
    getPendingRequests: async (_, __, { userId }) => {
      if (!userId) return [];
      return await FriendRequest.find({
        receiver: userId,
        status: "pending",
      }).populate("sender");
    },
  },
  Mutation: {
    createPost: async (_, { content }, { userId }) => {
      if (!userId) throw new Error("Unauthorized");
      const post = await Post.create({
        author: userId,
        content: content.trim(),
      });
      return await post.populate("author");
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
  },
  // Map _id to id for GraphQL compatibility if needed, 
  // though many setups handle this automatically.
  User: {
    id: (user) => user._id.toString(),
  },
  Post: {
    id: (post) => post._id.toString(),
  },
  FriendRequest: {
    id: (req) => req._id.toString(),
  },
};
