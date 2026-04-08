const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// 🔹 POST: Send a New Message
router.post("/", protect, async (req, res) => {
  const { content, chatId } = req.body;

  // 1. Basic Validation
  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data: Content or ChatID missing" });
  }

  // 2. MongoDB ID Validation (Prevents the 500 CastError)
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid Chat ID format" });
  }

  try {
    // Construct new message object
    let newMessage = {
      sender: req.user._id, // Provided by 'protect' middleware
      content: content,
      chat: chatId,
    };

    // Create message in database
    let message = await Message.create(newMessage);

    // 3. Populate Details (Sender and Chat)
    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    
    // Deep populate the users within that chat
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });

    // 4. Update the Chat model with the latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    // 5. Socket.io Integration (Safe Check)
    const io = req.app.get("io");
    if (io) {
      // Emit to the specific chat room
      io.to(chatId).emit("message received", message);
    } else {
      console.log("Warning: Socket.io (io) not found on req.app");
    }

    res.status(200).json(message);

  } catch (error) {
    console.error("Error in Message Route:", error.message);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

// 🔹 GET: Fetch all messages for a specific chat
router.get("/:chatId", protect, async (req, res) => {
  const { chatId } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid Chat ID format" });
  }

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email")
      .populate("chat")
      .sort({ createdAt: 1 }); // Ensure messages are in order

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;