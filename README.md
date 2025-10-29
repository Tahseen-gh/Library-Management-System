# 🚀 Quick Start

### 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### 🔨 Setup & Run

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Create Environment File**

   Create a `.env` file in the root directory:

   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/v1
   ```

3. **Start the Backend Server**

   In a new terminal window:

   ```bash
   cd server
   npm install
   npm run dev
   ```

   Server runs on: `http://localhost:3001`

4. **Start the Frontend (UI)**

   In the main project directory:

   ```bash
   npm run dev
   ```

   UI runs on: `http://localhost:3000`

5. **Open Your Browser**

   Navigate to: `http://localhost:3000`

## 📖 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Detailed system architecture and diagrams
- **[Server Documentation](./server/README.md)** - Backend API documentation

## 🛠️ Built With

- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: Node.js + Express + SQLite
- **State Management**: React Query
