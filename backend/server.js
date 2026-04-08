const express = require("express");
const http = require("http");
const axios = require("axios");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// 🔹 Routes
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// 🔹 FULL COMPILER LOGIC (Judge0 Free API)
app.post("/api/execute", async (req, res) => {
  const { language, code, input } = req.body;
  console.log(`[Compiler] Attempting to run: ${language}`);

  // Mapping languages to Judge0 CE language IDs
  const langConfig = {
    javascript: 102, // Node.js
    python: 100,     // Python
    cpp: 105,        // C++
    c: 103,          // C
    java: 91         // Java
  };

  const languageId = langConfig[language] || langConfig.javascript;

  try {
    const response = await axios.post("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
      source_code: code,
      language_id: languageId,
      stdin: input || ""
    });

    // Extracting output correctly
    const output = response.data.stdout || response.data.stderr || response.data.compile_output || "No output produced.";
    
    res.json({
      run: { output: output }
    });

  } catch (error) {
    console.error("Compiler API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "External Compiler Service is busy or down." });
  }
});

// 🔹 Your Routes
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"] } 
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join chat", (room) => socket.join(room));

  socket.on("send message", (data) => {
    if (!data.chat?.users) return;
    data.chat.users.forEach((user) => {
      if (user._id === data.sender._id) return;
      socket.in(user._id).emit("receive message", data);
    });
  });

  socket.on("code change", ({ roomId, code }) => {
    socket.in(roomId).emit("receive code", code);
  });

  socket.on("language change", ({ roomId, language }) => {
    socket.in(roomId).emit("receive language", language);
  });

  socket.on("switch mode", ({ roomId, mode }) => {
    socket.in(roomId).emit("receive view mode", mode);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));