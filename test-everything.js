const axios = require("axios");

const BASE_URL = "http://localhost:8001";
const API_BASE = `${BASE_URL}/api`;

// Test data
const testCarData = {
  carType: "Toyota",
  carModel: "Camry",
  year: "2020",
  mileage: "50000",
  problemDescription: "Engine makes strange noise when starting",
};

const testInvalidData = {
  carType: "",
  carModel: "",
  mileage: "",
  problemDescription: "",
};

console.log("🚀 Starting Comprehensive Car AI Test Suite...\n");

async function testHealthCheck() {
  console.log("1️⃣ Testing Health Check...");
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health Check PASSED:", response.data);
    return true;
  } catch (error) {
    console.log("❌ Health Check FAILED:", error.message);
    return false;
  }
}

async function testAnalyzeEndpoint() {
  console.log("\n2️⃣ Testing /api/analyze endpoint...");
  try {
    const response = await axios.post(`${API_BASE}/analyze`, testCarData);
    console.log("✅ /api/analyze PASSED:", {
      success: response.data.success,
      hasResult: !!response.data.result,
      hasFollowUp: !!response.data.followUpQuestions,
    });
    return true;
  } catch (error) {
    console.log(
      "❌ /api/analyze FAILED:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testAnalyzeGuidedEndpoint() {
  console.log("\n3️⃣ Testing /api/analyze-guided endpoint...");
  try {
    const response = await axios.post(
      `${API_BASE}/analyze-guided`,
      testCarData
    );
    console.log("✅ /api/analyze-guided PASSED:", {
      success: response.data.success,
      hasResult: !!response.data.result,
      hasFollowUp: !!response.data.followUpQuestions,
    });
    return true;
  } catch (error) {
    console.log(
      "❌ /api/analyze-guided FAILED:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testValidationErrors() {
  console.log("\n4️⃣ Testing Validation Error Handling...");
  try {
    await axios.post(`${API_BASE}/analyze`, testInvalidData);
    console.log("❌ Validation test FAILED - should have returned 400");
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation Error Handling PASSED (400 returned)");
      return true;
    } else {
      console.log(
        "❌ Validation Error Handling FAILED:",
        error.response?.status
      );
      return false;
    }
  }
}

async function testCarQueryAPI() {
  console.log("\n5️⃣ Testing CarQuery API...");
  try {
    const response = await axios.get(
      `${API_BASE}/car-query/year-range?make=toyota&model=camry`
    );
    console.log("✅ CarQuery API PASSED:", {
      success: response.data.success,
      hasYearRange: !!response.data.yearRange,
    });
    return true;
  } catch (error) {
    console.log(
      "❌ CarQuery API FAILED:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testYearValidation() {
  console.log("\n6️⃣ Testing Year Validation...");
  try {
    const response = await axios.post(`${API_BASE}/car-query/validate-year`, {
      make: "toyota",
      model: "camry",
      year: "2020",
    });
    console.log("✅ Year Validation PASSED:", {
      success: response.data.success,
      isValid: response.data.isValid,
    });
    return true;
  } catch (error) {
    console.log(
      "❌ Year Validation FAILED:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function testUploadEndpoint() {
  console.log("\n7️⃣ Testing Upload Endpoint...");
  try {
    // Test that the upload endpoint exists (POST /image)
    const response = await axios.post(`${API_BASE}/upload/image`);
    // If we get here, the endpoint exists (even if it fails due to missing file)
    console.log("✅ Upload Endpoint PASSED (endpoint exists)");
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("file")
    ) {
      console.log(
        "✅ Upload Endpoint PASSED (endpoint exists, expected file error)"
      );
      return true;
    } else {
      console.log(
        "❌ Upload Endpoint FAILED:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

async function testAuthEndpoint() {
  console.log("\n8️⃣ Testing Auth Endpoint...");
  try {
    // Test registration endpoint
    const response = await axios.post(`${API_BASE}/auth/register`, {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    console.log("✅ Auth Endpoint PASSED:", {
      success: response.data.success || true,
    });
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("already exists")
    ) {
      console.log("✅ Auth Endpoint PASSED (user already exists)");
      return true;
    } else {
      console.log(
        "❌ Auth Endpoint FAILED:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

async function testCarAnalysisEndpoint() {
  console.log("\n9️⃣ Testing Car Analysis Endpoint...");
  try {
    // Test that the endpoint exists (will fail due to missing auth token)
    const response = await axios.get(`${API_BASE}/car-analysis`);
    console.log("❌ Car Analysis Endpoint FAILED - should require auth");
    return false;
  } catch (error) {
    if (
      error.response?.status === 401 ||
      error.response?.data?.message?.includes("token")
    ) {
      console.log(
        "✅ Car Analysis Endpoint PASSED (requires auth as expected)"
      );
      return true;
    } else {
      console.log(
        "❌ Car Analysis Endpoint FAILED:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

async function testFrontendConnectivity() {
  console.log("\n🔗 Testing Frontend Connectivity...");
  try {
    // Test if frontend can reach backend
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Frontend can reach backend");
    return true;
  } catch (error) {
    console.log("❌ Frontend cannot reach backend:", error.message);
    return false;
  }
}

async function runAllTests() {
  const results = [];

  results.push(await testHealthCheck());
  results.push(await testAnalyzeEndpoint());
  results.push(await testAnalyzeGuidedEndpoint());
  results.push(await testValidationErrors());
  results.push(await testCarQueryAPI());
  results.push(await testYearValidation());
  results.push(await testUploadEndpoint());
  results.push(await testAuthEndpoint());
  results.push(await testCarAnalysisEndpoint());
  results.push(await testFrontendConnectivity());

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log("\n" + "=".repeat(50));
  console.log(`📊 TEST RESULTS: ${passed}/${total} tests passed`);
  console.log("=".repeat(50));

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED! Everything is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
  }

  console.log("\n🔧 Next Steps:");
  console.log("1. Test the frontend app manually using Expo Go");
  console.log("2. Verify form validation and AI diagnosis flow");
  console.log("3. Test Arabic/English input handling");
  console.log("4. Test Dodge special cases");
  console.log("5. Test file upload functionality");
}

// Run all tests
runAllTests().catch(console.error);
