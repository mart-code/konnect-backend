import User from "../models/UserModel.js";
import FriendRequest from "../models/FriendRequest.js";
import { emitToUser } from "../socket.js";

// Search users by email (excluding self)
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      email: { $regex: q, $options: "i" },
    }).select("_id email firstName lastName image color");

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }
    if (receiverId === req.userId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    const sender = await User.findById(req.userId);
    if (sender.friends.some((f) => f.toString() === receiverId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if pending request exists
    const existing = await FriendRequest.findOne({
      sender: req.userId,
      receiver: receiverId,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const request = await FriendRequest.create({
      sender: req.userId,
      receiver: receiverId,
    });

    // Populate sender for the real-time notification
    const populatedRequest = await FriendRequest.findById(request._id).populate("sender", "_id email firstName lastName image color");

    // Notify receiver in real-time
    emitToUser(receiverId, "newFriendRequest", populatedRequest);

    return res.status(201).json(request);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: req.userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    request.status = "accepted";
    await request.save();

    // Add each user to the other's friends list
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { friends: request.sender },
    });
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: req.userId },
    });

    // Notify original sender that their request was accepted
    // Note: We need to find the sender's info to get names for notification
    const me = await User.findById(req.userId).select("firstName email");

    emitToUser(request.sender.toString(), "friendRequestAccepted", {
      friendId: req.userId,
      friendName: me.firstName || me.email
    });

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      receiver: req.userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    return res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// List current user's friends
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("friends", "_id email firstName lastName image color profileSetup")
      .select("friends");

    return res.status(200).json(user.friends);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// List incoming pending friend requests
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: "pending",
    }).populate("sender", "_id email firstName lastName image color");

    return res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
