import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

async function testCurrentBehavior() {
  console.log("🧪 Testing Current Smart Questions Behavior...\n");

  try {
    // Test 1: Initial analysis with no previous questions
    console.log("1. Testing initial analysis...");
    const initialPayload = {
      carType: "Toyota",
      carModel: "Camry 2020",
      mileage: "50000",
      problemDescription: "المحرك يصدر صوت طقطقة عند التشغيل",
    };

    const initialResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      initialPayload
    );

    console.log("✅ Initial analysis successful");
    console.log(
      "📊 Follow-up questions received:",
      initialResponse.data.followUpQuestions?.length || 0
    );

    if (initialResponse.data.followUpQuestions?.length > 0) {
      console.log("📝 Questions received:");
      initialResponse.data.followUpQuestions.forEach((q: any, i: number) => {
        console.log(`   ${i + 1}. ${q.question}`);
      });
    }
    console.log("");

    // Test 2: Check if we're getting hardcoded questions
    const hardcodedQuestions = [
      "هل تسمع أصوات غريبة من المحرك؟",
      "متى بدأت هذه المشكلة؟",
      "هل تزداد المشكلة مع زيادة السرعة؟",
    ];

    const isHardcoded = initialResponse.data.followUpQuestions?.every(
      (q: any) => hardcodedQuestions.includes(q.question)
    );

    console.log("🔍 Analysis:");
    console.log("   - Are we getting hardcoded questions?", isHardcoded);
    console.log("   - Response note:", initialResponse.data.note);
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("Status code:", error.response.status);
    }
  }
}

testCurrentBehavior();
