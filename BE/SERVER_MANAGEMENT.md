# Server Management Guide

## How to Prevent Port Conflicts and Server Issues

### 1. **Use PM2 Process Manager (Recommended)**

PM2 automatically handles process management, restarts, and prevents port conflicts.

#### Quick Start:

```bash
# Start the server with PM2
npm run pm2:start

# Check server status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart server
npm run pm2:restart

# Stop server
npm run pm2:stop
```

#### Using the Batch File (Windows):

Double-click `start-server.bat` in the BE folder.

### 2. **Manual Process Management**

If you prefer manual control:

#### Check for Port Conflicts:

```bash
# Check what's using port 8001
netstat -ano | findstr :8001

# Kill process by PID (replace XXXX with the actual PID)
taskkill /PID XXXX /F
```

#### Start Server Manually:

```bash
# Build and start
npm run build
npm start

# Or for development with auto-restart
npm run dev
```

### 3. **Common Issues and Solutions**

#### Issue: "EADDRINUSE" (Port already in use)

**Solution:**

```bash
# Find the process
netstat -ano | findstr :8001

# Kill it
taskkill /PID <PID> /F

# Or use PM2 to manage it
pm2 delete car-ai-backend
pm2 start ecosystem.config.js
```

#### Issue: "Cannot find module"

**Solution:**

```bash
# Rebuild the project
npm run build

# Then start
npm start
```

#### Issue: Changes not reflecting

**Solution:**

```bash
# Rebuild and restart
npm run dev:clean
```

### 4. **Best Practices**

1. **Always use PM2** for production-like environments
2. **Check server status** before making changes
3. **Rebuild after code changes** (`npm run build`)
4. **Monitor logs** for errors (`pm2 logs car-ai-backend`)
5. **Use the batch file** for easy startup on Windows

### 5. **Useful Commands**

```bash
# Check if server is running
curl http://localhost:8001/health

# View all PM2 processes
pm2 list

# Monitor server in real-time
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6. **Development Workflow**

1. **Start server:** `npm run pm2:start` or double-click `start-server.bat`
2. **Make code changes**
3. **Rebuild:** `npm run build`
4. **Restart:** `npm run pm2:restart`
5. **Test:** Send request to `http://localhost:8001/api/analyze-guided`

### 7. **Troubleshooting**

- **Server won't start:** Check logs with `pm2 logs car-ai-backend`
- **Port conflicts:** Use `netstat -ano | findstr :8001` then kill the process
- **Code not updating:** Rebuild with `npm run build` then restart
- **Environment variables not loading:** Check `.env` file and restart server

This setup will prevent most port conflicts and make server management much easier!
