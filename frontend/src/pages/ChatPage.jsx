import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const ENDPOINT = "http://127.0.0.1:8000"; 
let socket;

const codeTemplates = {
  javascript: `console.log("Hello World");`,
  python: `print("Hello World")`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World";\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`
};

function ChatPage() {
  const [chats, setChats] = useState([]); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState("chat"); 
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(codeTemplates.javascript);
  const [output, setOutput] = useState(""); 
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("join chat", userId);
    socket.on("receive message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("receive code", (updatedCode) => setCode(updatedCode));
    socket.on("receive language", (lang) => setLanguage(lang));
    socket.on("receive view mode", (mode) => setViewMode(mode));
    return () => socket.disconnect();
  }, [userId]);

  const fetchChats = async () => {
    try {
      const { data } = await axios.get(`${ENDPOINT}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchChats(); }, [token]);

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) return setSearchResults([]);
    try {
      const { data } = await axios.get(`${ENDPOINT}/api/users?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(data);
    } catch (error) { console.error(error); }
  };

  const accessChat = async (id) => {
    try {
      const { data } = await axios.post(`${ENDPOINT}/api/chats`, { userId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setSearchResults([]);
      setSearch("");
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      const { data } = await axios.get(`${ENDPOINT}/api/messages/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data);
      socket.emit("join chat", selectedChat._id);
    };
    fetchMessages();
  }, [selectedChat, token]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const { data } = await axios.post(`${ENDPOINT}/api/messages`,
      { content: newMessage, chatId: selectedChat._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    socket.emit("send message", data);
    setMessages([...messages, data]);
    setNewMessage("");
  };

  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit("code change", { roomId: selectedChat._id, code: value });
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "chat" ? "code" : "chat";
    setViewMode(newMode);
    socket.emit("switch mode", { roomId: selectedChat._id, mode: newMode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(codeTemplates[newLang]); 
    socket.emit("language change", { roomId: selectedChat._id, language: newLang });
    socket.emit("code change", { roomId: selectedChat._id, code: codeTemplates[newLang] });
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Executing Code...");
    try {
      // 🔹 Sends 'javascript', 'python', etc. to match backend mapper
      const { data } = await axios.post(`${ENDPOINT}/api/execute`, {
        language: language,
        code: code,
        input: customInput,
      });
      if (data.run) setOutput(data.run.output);
    } catch (err) {
      setOutput("Error: Backend is not responding.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-indigo-400">Messenger</h2>
          <input 
            type="text" placeholder="Find users..." value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded-lg text-sm outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute w-64 bg-gray-700 mt-2 rounded-lg shadow-2xl z-50">
              {searchResults.map(u => (
                <div key={u._id} onClick={() => accessChat(u._id)} className="p-3 hover:bg-indigo-600 cursor-pointer">
                  {u.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((c) => (
            <div key={c._id} onClick={() => setSelectedChat(c)} className={`p-4 border-b border-gray-700 cursor-pointer ${selectedChat?._id === c._id ? "bg-indigo-600/30" : ""}`}>
              <p className="font-semibold text-sm">{c.users.find(u => u._id !== userId)?.name || "User"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <span className="font-bold text-indigo-300">{selectedChat.users.find(u => u._id !== userId)?.name}</span>
                <div className="flex gap-2">
                  {viewMode === "code" && (
                    <select value={language} onChange={handleLanguageChange} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="java">Java</option>
                    </select>
                  )}
                  <button onClick={toggleViewMode} className="bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500">
                    {viewMode === "chat" ? "OPEN EDITOR" : "BACK TO CHAT"}
                  </button>
                </div>
            </div>

            {viewMode === "chat" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender._id === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-2 rounded-2xl max-w-md ${m.sender._id === userId ? "bg-indigo-600" : "bg-gray-700"}`}>
                        <p className="text-sm">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
                  <input className="flex-1 bg-gray-700 rounded-xl px-4 py-2 outline-none" placeholder="Message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={sendMessage} className="bg-indigo-500 px-6 rounded-xl font-bold">Send</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                <div className="flex-1">
                  <Editor height="100%" theme="vs-dark" language={language} value={code} onChange={handleEditorChange} options={{ fontSize: 14, minimap: { enabled: false } }} />
                </div>
                <div className="h-48 bg-black border-t border-gray-700 flex font-mono text-sm">
                  {/* Standard Input Section */}
                  <div className="w-1/3 flex flex-col p-4 border-r border-gray-800">
                    <span className="text-gray-500 text-xs font-bold uppercase mb-2">Standard Input</span>
                    <textarea 
                      className="flex-1 bg-gray-900 border border-gray-800 p-2 text-gray-300 outline-none resize-none rounded-md"
                      placeholder="Type input here..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                    ></textarea>
                  </div>
                  {/* Console Output Section */}
                  <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-xs font-bold uppercase">Console Output</span>
                      <button onClick={runCode} disabled={isRunning} className={`${isRunning ? "bg-gray-600" : "bg-green-600"} text-white px-4 py-1 rounded text-xs font-bold uppercase`}>
                        {isRunning ? "Running..." : "Run Code"}
                      </button>
                    </div>
                    <pre className="flex-1 text-green-400 whitespace-pre-wrap overflow-y-auto">{output}</pre>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 italic">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
export default ChatPage;