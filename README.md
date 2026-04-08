# CodeTalk - Real-Time Collaborative Environment 🚀

**CodeTalk** is a full-stack MERN application that provides a unified, real-time environment for developers to chat, collaborate on code, and execute programs across multiple programming languages directly in the browser.

## 🎯 Key Features

- **Real-Time Encrypted Chat**: Send and receive messages instantly via Socket.io.
- **Collaborative Code Editor**: A sleek, dark-themed Monaco Code Editor integrated right next to your chat.
- **Multi-Language Compiler**: Write and compile code on the fly in **JavaScript, Python, C++, C, and Java**.
- **Interactive STDIN Support**: An integrated standard input pipeline allows your compiled scripts to accept dynamic inputs (e.g. \`cin >>\`, \`input()\`, \`Scanner\`) effortlessly!
- **Secure Authentication**: Built-in user authentication and authorization using JWTs.
- **Highly Responsive UI**: Stunning gradient animations and frosted glass elements powered by TailwindCSS.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **TailwindCSS** (Styling & Animations)
- **Monaco Editor** (Code editing experience)
- **Socket.io-client** (WebSockets)
- **Axios** (API requests)

### Backend
- **Node.js & Express.js**
- **MongoDB** / Mongoose (Database)
- **Socket.io** (Real-time events)
- **Judge0 CE API** (Code compilation engine)
- **JWT** (Authentication)

---

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository
\`\`\`bash
git clone <your-repo-url>
cd mern-realtime-chat
\`\`\`

### 2. Backend Setup
1. Open a new terminal and navigate to the backend folder:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up your \`.env\` file in the `backend` directory. It should look like this:
   \`\`\`env
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   \`\`\`
4. Start the server:
   \`\`\`bash
   # Make sure Vite isn't blocking port 8000, then run
   node server.js
   \`\`\`

### 3. Frontend Setup
1. Open a separate terminal and navigate to the frontend folder:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Vite development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### 4. Experience the Platform
Visit the local URL provided by Vite (typically \`http://localhost:5173\` or \`http://localhost:5174\`) in your browser to start building!

---

## 💡 How It Works
- **Chat Mode & Editor Mode**: Users can seamlessly toggle between a full-width chat and the integrated Code Editor while retaining connection states.
- **Judge0 Integration**: When a user highlights \`Run Code\`, the backend extracts the source payload and \`stdin\` buffer from the frontend and pushes it to the unauthenticated Judge0 Compiler pipeline. Output traces are perfectly parsed back to the Virtual Console!

---

## 📄 License
This project is open-source and available under the MIT License.
