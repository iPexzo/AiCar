# 🚀 Car AI Project - Startup Guide

## ✅ **Quick Start (Recommended)**

### **Option 1: Start Backend Only (Recommended for Development)**

```bash
# From the root directory (CarAi/)
npm start
```

This will:

- Kill any existing process on port 8001
- Start the backend server with nodemon (auto-restart on changes)
- Run on http://localhost:8001

### **Option 2: Start Both Backend and Frontend**

```bash
# From the root directory (CarAi/)
npm run dev
```

This will:

- Start backend on port 8001
- Start frontend on port 19006 (Expo)
- Run both concurrently

### **Option 3: Clean Start (If you have port conflicts)**

```bash
npm run clean-start
```

This will:

- Force kill any process on port 8001
- Start the backend server

### **Option 4: Start Backend Only (from BE directory)**

```bash
cd BE
npm run dev:safe
```

### **Option 5: Start Frontend Only (from FE directory)**

```bash
cd FE
npm start
```

---

## 🔧 **What Each Command Does**

### **Root Directory Commands:**

- `npm start` → Starts the backend server (BE)
- `npm run dev` → Starts both backend and frontend simultaneously
- `npm run start:backend` → Starts only the backend
- `npm run start:frontend` → Starts only the frontend
- `npm run clean-start` → Kills port 8001 and starts backend
- `npm run kill-port` → Kills any process on port 8001

### **Backend Directory (BE/) Commands:**

- `npm run dev` → Starts backend with nodemon (auto-restart)
- `npm run dev:safe` → Kills port 8001 first, then starts backend
- `npm run start` → Starts production build
- `npm run start:safe` → Kills port 8001 first, then starts production
- `npm run build` → Build TypeScript to JavaScript
- `npm run kill-port` → Kills port 8001

### **Frontend Directory (FE/) Commands:**

- `npm start` → Starts Expo development server

---

## 🎯 **Recommended Workflow**

### **For Development:**

1. **Start Backend:**

   ```bash
   npm start
   ```

   This will automatically handle port conflicts and start the server.

2. **Start Frontend (in new terminal):**
   ```bash
   npm run start:frontend
   ```

### **For Quick Testing:**

```bash
npm run dev
```

This starts both backend and frontend at once.

---

## 🚨 **Troubleshooting**

### **Port 8001 Already in Use:**

The backend now automatically handles this! If you still get errors:

1. **Manual fix:**

   ```bash
   # Kill any process using port 8001
   npx kill-port 8001

   # Then start the server
   npm start
   ```

2. **Use safe mode:**
   ```bash
   cd BE
   npm run dev:safe
   ```

### **Frontend Port 8081 Already in Use:**

```bash
cd FE
npm start -- --port=8082
```

### **MongoDB Connection Issues:**

Make sure MongoDB is running locally or update the connection string in `BE/.env`

### **Backend Won't Start:**

1. Check if port 8001 is free:

   ```bash
   npm run kill-port
   ```

2. Check if all dependencies are installed:

   ```bash
   npm run install:all
   ```

3. Check if TypeScript is compiled:
   ```bash
   cd BE
   npm run build
   ```

### **Frontend Won't Start:**

1. Make sure backend is running first
2. Check if Expo CLI is installed:
   ```bash
   npm install -g @expo/cli
   ```

---

## 📊 **Expected Output**

### **Backend Success:**

```
Loaded OpenAI Key: sk-proj-RBYI
=== Car AI Backend Server Starting ===
=== CORS enabled for all origins ===
✅ Port 8001 is available
🚀 Server running on 0.0.0.0:8001
📊 Health check: http://localhost:8001/health
🔗 API Base URL: http://localhost:8001/api
🌐 LAN Access: http://0.0.0.0:8001
```

### **Frontend Success:**

```
› Metro waiting on exp://192.168.8.149:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

---

## 🎉 **Ready to Use!**

Once both servers are running:

- **Backend API:** http://localhost:8001
- **Frontend:** Scan QR code with Expo Go app
- **Health Check:** http://localhost:8001/health

Your Car AI project is now ready for development! 🚗✨

## 📋 **API Endpoints**

Once backend is running, you can test:

- **Health Check**: http://localhost:8001/health
- **Car Analysis**: POST http://localhost:8001/api/analyze-guided
- **Smart Questions**: POST http://localhost:8001/api/generate-questions
- **Follow-up Analysis**: POST http://localhost:8001/api/analyze-followup

## 💡 **Development Tips**

1. **Backend Development**: Use `npm start` for auto-restart on changes
2. **Frontend Development**: Use `npm run start:frontend` for Expo development
3. **Full Stack**: Use `npm run dev` for both backend and frontend
4. **Port Conflicts**: Always use `npm run clean-start` if you have issues
5. **Testing**: Backend tests are in the `BE/` directory

## 📋 **Environment Variables**

Make sure you have a `.env` file in the `BE/` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string
PORT=8001
```

## 📂 **File Structure**

```
CarAi/
├── BE/                 # Backend (Node.js/Express/TypeScript)
│   ├── src/           # Source code
│   ├── dist/          # Compiled JavaScript
│   └── package.json   # Backend dependencies
├── FE/                # Frontend (React Native/Expo)
│   ├── app/           # App screens
│   ├── components/    # React components
│   └── package.json   # Frontend dependencies
└── package.json       # Root dependencies and scripts
```

Your Car AI project is now ready for development! 🚗✨
