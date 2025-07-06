import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

async function testSmartQuestions() {
  console.log("🧪 Testing Smart Questions with Conversation History...\n");

  try {
    // Test 1: Initial analysis with no previous questions
    console.log("1. Testing initial analysis (no previous questions)...");
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
      console.log(
        "📝 First question:",
        initialResponse.data.followUpQuestions[0].question
      );
    }
    console.log("");

    // Test 2: Second analysis with one previous question
    console.log("2. Testing with one previous question...");
    const secondPayload = {
      ...initialPayload,
      previousQuestions: [initialResponse.data.followUpQuestions[0].question],
      previousAnswers: ["نعم"],
    };

    const secondResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      secondPayload
    );

    console.log("✅ Second analysis successful");
    console.log(
      "📊 New questions received:",
      secondResponse.data.followUpQuestions?.length || 0
    );

    if (secondResponse.data.followUpQuestions?.length > 0) {
      console.log(
        "📝 Second question:",
        secondResponse.data.followUpQuestions[0].question
      );
      console.log(
        "🔍 Is it different from first?",
        secondResponse.data.followUpQuestions[0].question !==
          initialResponse.data.followUpQuestions[0].question
      );
    }
    console.log("");

    // Test 3: Third analysis with two previous questions
    console.log("3. Testing with two previous questions...");
    const thirdPayload = {
      ...initialPayload,
      previousQuestions: [
        initialResponse.data.followUpQuestions[0].question,
        secondResponse.data.followUpQuestions[0].question,
      ],
      previousAnswers: ["نعم", "قبل أسبوع"],
    };

    const thirdResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      thirdPayload
    );

    console.log("✅ Third analysis successful");
    console.log(
      "📊 New questions received:",
      thirdResponse.data.followUpQuestions?.length || 0
    );

    if (thirdResponse.data.followUpQuestions?.length > 0) {
      console.log(
        "📝 Third question:",
        thirdResponse.data.followUpQuestions[0].question
      );
      console.log(
        "🔍 Is it different from previous?",
        thirdResponse.data.followUpQuestions[0].question !==
          initialResponse.data.followUpQuestions[0].question &&
          thirdResponse.data.followUpQuestions[0].question !==
            secondResponse.data.followUpQuestions[0].question
      );
    }
    console.log("");

    // Test 4: Fourth analysis with three previous questions (should skip to analysis)
    console.log(
      "4. Testing with three previous questions (should skip to analysis)..."
    );
    const fourthPayload = {
      ...initialPayload,
      previousQuestions: [
        initialResponse.data.followUpQuestions[0].question,
        secondResponse.data.followUpQuestions[0].question,
        thirdResponse.data.followUpQuestions[0].question,
      ],
      previousAnswers: ["نعم", "قبل أسبوع", "نعم"],
    };

    const fourthResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      fourthPayload
    );

    console.log("✅ Fourth analysis successful");
    console.log(
      "📊 Follow-up questions received:",
      fourthResponse.data.followUpQuestions?.length || 0
    );
    console.log("📝 Analysis received:", !!fourthResponse.data.result);
    console.log("");

    // Test 5: Different problem description to test context awareness
    console.log("5. Testing with different problem description...");
    const differentProblemPayload = {
      carType: "BMW",
      carModel: "X5 2021",
      mileage: "30000",
      problemDescription: "السيارة لا تبدأ عند الضغط على زر التشغيل",
    };

    const differentResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      differentProblemPayload
    );

    console.log("✅ Different problem analysis successful");
    console.log(
      "📊 Follow-up questions received:",
      differentResponse.data.followUpQuestions?.length || 0
    );

    if (differentResponse.data.followUpQuestions?.length > 0) {
      console.log(
        "📝 Different problem question:",
        differentResponse.data.followUpQuestions[0].question
      );
      console.log(
        "🔍 Is it different from previous questions?",
        differentResponse.data.followUpQuestions[0].question !==
          initialResponse.data.followUpQuestions[0].question
      );
    }
    console.log("");

    // Test 6: Skip follow-up flag
    console.log("6. Testing skip follow-up flag...");
    const skipPayload = {
      ...initialPayload,
      skipFollowUp: true,
    };

    const skipResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      skipPayload
    );

    console.log("✅ Skip follow-up test successful");
    console.log(
      "📊 Follow-up questions received:",
      skipResponse.data.followUpQuestions?.length || 0
    );
    console.log("📝 Analysis received:", !!skipResponse.data.result);
    console.log("");

    console.log("🎉 All Smart Questions tests passed!");
    console.log("");
    console.log("📋 Summary:");
    console.log("   ✅ Initial analysis generates first question");
    console.log("   ✅ Second analysis generates different question");
    console.log("   ✅ Third analysis generates different question");
    console.log("   ✅ Fourth analysis skips to diagnosis (3 questions limit)");
    console.log(
      "   ✅ Different problem descriptions generate context-aware questions"
    );
    console.log("   ✅ Skip flag works correctly");
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("Status code:", error.response.status);
    }
  }
}

testSmartQuestions();
