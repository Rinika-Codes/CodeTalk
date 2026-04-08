const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId not provided");
  }

  try {

    let chat = await Chat.find({
      users: {
        $all: [req.user._id, userId]
      }
    }).populate("users", "-password");

    if (chat.length > 0) {
      res.send(chat[0]);
    } else {

      const newChat = await Chat.create({
        users: [req.user._id, userId]
      });

      const fullChat = await Chat.findById(newChat._id).populate("users","-password");

      res.status(200).send(fullChat);
    }
   
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;