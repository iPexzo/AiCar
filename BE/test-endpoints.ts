const axios = require("axios");

const API_BASE_URL = "http://localhost:8001";

async function testEndpoints() {
  console.log("🧪 Testing Car AI Backend Endpoints...\n");

  try {
    // Test 1: Health check
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log("✅ Health check passed:", healthResponse.data.message);
    console.log("");

    // Test 2: Initial analysis
    console.log("2. Testing initial analysis endpoint...");
    const initialAnalysisPayload = {
      carType: "Toyota",
      carModel: "Corolla 2020",
      mileage: "50000",
      problemDescription: "السيارة بطيئة في التسارع",
    };

    const initialResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      initialAnalysisPayload
    );
    console.log("✅ Initial analysis successful");
    console.log(
      "📊 Response includes followUpQuestions:",
      !!initialResponse.data.followUpQuestions
    );
    console.log(
      "📝 Follow-up questions count:",
      initialResponse.data.followUpQuestions?.length || 0
    );
    console.log("");

    // Test 3: Follow-up analysis
    console.log("3. Testing follow-up analysis endpoint...");
    const followUpPayload = {
      initialAnalysis: initialResponse.data.result,
      followUpAnswers: [
        { questionId: "1", answer: "نعم" },
        { questionId: "2", answer: "قبل أسبوع" },
        { questionId: "3", answer: "نعم" },
      ],
      carDetails: {
        carType: "Toyota",
        carModel: "Corolla 2020",
        mileage: "50000",
        problemDescription: "السيارة بطيئة في التسارع",
      },
    };

    const followUpResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-followup`,
      followUpPayload
    );
    console.log("✅ Follow-up analysis successful");
    console.log(
      "📊 Response includes enhanced analysis:",
      !!followUpResponse.data.result
    );
    console.log("");

    console.log(
      "🎉 All tests passed! The enhanced AI analysis flow is working correctly."
    );
    console.log("");
    console.log("📱 You can now test the frontend with the new features:");
    console.log("   - Image upload");
    console.log("   - Initial analysis");
    console.log("   - Follow-up questions");
    console.log("   - Final enhanced analysis");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testEndpoints();
