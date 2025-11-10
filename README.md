# 🚀 Quick Start

### 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### 🔨 Setup & Run

1. **Install Dependencies**

   ```powershell
   cd ui
   npm i

   cd ../
   cd server
   npm i
   ```

2. **Create Environment File**

   Create a `.env` file in the `server` directory:

   Paste this in:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security Configuration
   CORS_ORIGIN=http://localhost:5174

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   API_BASE_URL=/api/v1
   ```

   Create a `.env` file in the `ui` directory:

   Paste this in:

   ```env
   VITE_API_BASE_URL=https://wpl-api-fgv5.onrender.com/api/v1/
   ```

3. **Start the Backend Server**

   In a new terminal window:

   ```bash
   cd server
   npm run dev
   ```

   Server runs on: `http://localhost:3000`

4. **Start the Frontend (UI)**

   In the main project directory:

   ```bash
   cd ui
   npm run dev
   ```

   UI runs on: `http://localhost:5173`

   > sometimes it will do :5174, idk why

   <br />

5. **Open Your Browser**

   Navigate to: `http://localhost:5173`

## 📖 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Detailed system architecture and diagrams

## 🛠️ Built With

- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: Node.js + Express + SQLite
- **State Management**: React Query
