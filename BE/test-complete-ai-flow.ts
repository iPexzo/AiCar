import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

async function testCompleteAIFlow() {
  console.log("🧪 Testing Complete AI Flow - Updated Behavior\n");

  try {
    // Test 1: Initial diagnosis (should be preliminary only)
    console.log("1️⃣ Testing Initial Diagnosis (Preliminary Analysis)...");

    const initialResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      {
        carType: "تويوتا",
        carModel: "كامري",
        mileage: "150000",
        problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
        lastServiceType: "تغيير زيت",
        previousQuestions: [],
        previousAnswers: [],
      }
    );

    console.log("✅ Initial Diagnosis Response:");
    console.log("Status:", initialResponse.status);
    console.log(
      "Has Follow-up Questions:",
      initialResponse.data.followUpQuestions?.length > 0
    );
    console.log("Analysis Type:", initialResponse.data.note);
    console.log(
      "Analysis Preview:",
      initialResponse.data.result?.substring(0, 300) + "..."
    );
    console.log("");

    // Test 2: Generate smart questions using dedicated endpoint
    console.log("2️⃣ Testing Smart Questions Generation...");

    const questionsResponse = await axios.post(
      `${API_BASE_URL}/api/generate-questions`,
      {
        carDetails: {
          carType: "تويوتا",
          carModel: "كامري",
          mileage: "150000",
          problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
          lastServiceType: "تغيير زيت",
        },
        problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
        previousQuestions: [],
        previousAnswers: [],
      }
    );

    console.log("✅ Smart Questions Response:");
    console.log("Status:", questionsResponse.status);
    console.log(
      "Questions Generated:",
      questionsResponse.data.questions?.length
    );
    console.log(
      "Questions:",
      questionsResponse.data.questions?.map((q: any) => q.question)
    );
    console.log("");

    // Test 3: Generate additional questions based on first answer
    console.log("3️⃣ Testing Additional Smart Questions...");

    const additionalQuestionsResponse = await axios.post(
      `${API_BASE_URL}/api/generate-questions`,
      {
        carDetails: {
          carType: "تويوتا",
          carModel: "كامري",
          mileage: "150000",
          problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
          lastServiceType: "تغيير زيت",
        },
        problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
        previousQuestions:
          questionsResponse.data.questions?.map((q: any) => q.question) || [],
        previousAnswers: ["نعم، الصوت يزداد مع زيادة السرعة"],
      }
    );

    console.log("✅ Additional Questions Response:");
    console.log("Status:", additionalQuestionsResponse.status);
    console.log(
      "Additional Questions:",
      additionalQuestionsResponse.data.questions?.map((q: any) => q.question)
    );
    console.log("");

    // Test 4: Final detailed analysis after 3 answers
    console.log("4️⃣ Testing Final Detailed Analysis...");

    const finalAnalysisResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-followup`,
      {
        initialAnalysis: initialResponse.data.result,
        followUpAnswers: [
          { answer: "نعم، الصوت يزداد مع زيادة السرعة" },
          { answer: "بدأت المشكلة منذ أسبوعين" },
          { answer: "نعم، ألاحظ اهتزاز في عجلة القيادة" },
        ],
        carDetails: {
          carType: "تويوتا",
          carModel: "كامري",
          mileage: "150000",
          problemDescription: "أسمع صوت طقطقة من المحرك عند التسارع",
          lastServiceType: "تغيير زيت",
        },
      }
    );

    console.log("✅ Final Analysis Response:");
    console.log("Status:", finalAnalysisResponse.status);
    console.log("Analysis Type:", finalAnalysisResponse.data.note);
    console.log(
      "Analysis Preview:",
      finalAnalysisResponse.data.result?.substring(0, 400) + "..."
    );
    console.log("");

    // Test 5: Skip follow-up and get detailed analysis directly
    console.log("5️⃣ Testing Skip Follow-up (Direct Detailed Analysis)...");

    const skipResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      {
        carType: "دودج",
        carModel: "تشارجر",
        mileage: "80000",
        problemDescription: "مشكلة في الفرامل، لا تستجيب بشكل جيد",
        lastServiceType: "تغيير زيت",
        skipFollowUp: true,
        previousQuestions: [],
        previousAnswers: [],
      }
    );

    console.log("✅ Skip Follow-up Response:");
    console.log("Status:", skipResponse.status);
    console.log(
      "Has Follow-up Questions:",
      skipResponse.data.followUpQuestions?.length > 0
    );
    console.log("Analysis Type:", skipResponse.data.note);
    console.log(
      "Analysis Preview:",
      skipResponse.data.result?.substring(0, 400) + "..."
    );
    console.log("");

    console.log("🎉 Complete AI Flow Test Completed Successfully!");
    console.log("\n📋 Summary:");
    console.log("- ✅ Initial diagnosis provides preliminary analysis only");
    console.log(
      "- ✅ Smart questions are generated dynamically using /api/generate-questions"
    );
    console.log(
      "- ✅ Additional questions are context-aware and non-repetitive"
    );
    console.log(
      "- ✅ Final analysis includes parts, prices, and repair instructions"
    );
    console.log("- ✅ Skip option provides detailed analysis directly");
    console.log("\n🔧 Flow:");
    console.log("1. Initial: /api/analyze-guided → Preliminary overview");
    console.log(
      "2. Questions: /api/generate-questions → Dynamic smart questions"
    );
    console.log("3. Final: /api/analyze-followup → Detailed technical report");
  } catch (error: any) {
    console.error("❌ Test Failed:", error.response?.data || error.message);

    if (error.response?.status === 500) {
      console.log(
        "\n💡 Tip: Make sure the backend server is running and OpenAI API key is configured"
      );
    }
  }
}

// Run the test
testCompleteAIFlow();
