import Message from "../models/Message.js";

// Get DM history between current user and a contact
export const getDMMessages = async (req, res) => {
  try {
    const { contactId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: contactId },
        { sender: contactId, receiver: req.userId },
      ],
    })
      .populate("sender", "_id email firstName lastName image color")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get group message history
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId })
      .populate("sender", "_id email firstName lastName image color")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Upload a file in chat — multer will handle the file itself; this just returns the URL
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Determine messageType from mimetype
    const mime = req.file.mimetype;
    let messageType = "file";
    if (mime.startsWith("image/")) messageType = "image";
    else if (mime.startsWith("audio/")) messageType = "audio";
    else if (mime.startsWith("video/")) messageType = "video";

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({ fileUrl, messageType, originalName: req.file.originalname });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
