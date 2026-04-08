import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fullText = "Create Account";
  const navigate = useNavigate();

  // Typing animation effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // 🔹 The Registration Logic
  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    try {
      const { data } = await axios.post("http://localhost:8000/api/users/register", {
        name,
        email,
        password,
      });

      // ✅ Check if backend sends a token (Auto-Login)
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data._id);
        alert("Account created successfully!");
        navigate("/chat");
      } else {
        // If no token is sent, go to login page
        alert("Registration successful! Please login.");
        navigate("/");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 animate-gradient">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-96 text-white transition duration-300 hover:scale-105 hover:shadow-purple-500/30">

        <h1 className="text-3xl font-bold text-center mb-6 tracking-wider">
          {text}<span className="animate-pulse">|</span>
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />

        <button 
          onClick={handleRegister}
          className="w-full bg-indigo-500 hover:bg-indigo-600 transition p-3 rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/50"
        >
          Register
        </button>

        <p className="text-center mt-5 text-gray-300">
          Already have an account?{" "}
          <Link to="/" className="text-indigo-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;