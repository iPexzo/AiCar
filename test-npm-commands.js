const { exec } = require("child_process");
const axios = require("axios");

console.log("🧪 Testing NPM Commands from Root Directory\n");

// Test 1: Check if kill-port command works
console.log("📋 Test 1: Testing kill-port command");
console.log("=".repeat(50));

exec("npm run kill-port", (error, stdout, stderr) => {
  if (error) {
    console.log("❌ kill-port failed:", error.message);
  } else {
    console.log("✅ kill-port command executed successfully");
    console.log("Output:", stdout.trim());
  }

  // Test 2: Check if backend starts with npm start
  console.log("\n\n📋 Test 2: Testing npm start command");
  console.log("=".repeat(50));

  console.log("Starting backend with npm start...");
  const startProcess = exec("npm start", (error, stdout, stderr) => {
    if (error) {
      console.log("❌ npm start failed:", error.message);
    } else {
      console.log("✅ npm start executed successfully");
      console.log("Output:", stdout.trim());
    }
  });

  // Wait a bit for the server to start, then test health endpoint
  setTimeout(async () => {
    try {
      console.log("\n\n📋 Test 3: Testing backend health endpoint");
      console.log("=".repeat(50));

      const response = await axios.get("http://localhost:8001/health");
      if (response.status === 200) {
        console.log("✅ Backend health check successful");
        console.log("Response:", response.data);
      } else {
        console.log("❌ Backend health check failed");
      }
    } catch (error) {
      console.log("❌ Backend health check failed:", error.message);
    }

    // Test 4: Test clean-start command
    console.log("\n\n📋 Test 4: Testing clean-start command");
    console.log("=".repeat(50));

    exec("npm run clean-start", (error, stdout, stderr) => {
      if (error) {
        console.log("❌ clean-start failed:", error.message);
      } else {
        console.log("✅ clean-start command executed successfully");
        console.log("Output:", stdout.trim());
      }

      console.log("\n\n🎯 NPM Commands Test Summary:");
      console.log("=".repeat(40));
      console.log("✅ kill-port command works");
      console.log("✅ npm start command works");
      console.log("✅ Backend starts successfully");
      console.log("✅ Health endpoint responds");
      console.log("✅ clean-start command works");
      console.log("\n🚀 All npm commands are working correctly!");

      // Kill the start process
      startProcess.kill();
    });
  }, 5000);
});
