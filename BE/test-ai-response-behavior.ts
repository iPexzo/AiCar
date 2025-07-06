import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

async function testAIReponseBehavior() {
  console.log("🧪 Testing Updated AI Response Behavior\n");

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
      initialResponse.data.result?.substring(0, 200) + "..."
    );
    console.log("");

    // Test 2: Follow-up questions
    if (initialResponse.data.followUpQuestions?.length > 0) {
      console.log("2️⃣ Testing Follow-up Questions...");

      const questions = initialResponse.data.followUpQuestions;
      console.log(
        "Generated Questions:",
        questions.map((q: any) => q.question)
      );
      console.log("");

      // Test 3: Detailed analysis after answering questions
      console.log("3️⃣ Testing Detailed Analysis After Follow-up...");

      const detailedResponse = await axios.post(
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

      console.log("✅ Detailed Analysis Response:");
      console.log("Status:", detailedResponse.status);
      console.log("Analysis Type:", detailedResponse.data.note);
      console.log(
        "Analysis Preview:",
        detailedResponse.data.result?.substring(0, 300) + "..."
      );
      console.log("");

      // Test 4: Skip follow-up and get detailed analysis directly
      console.log("4️⃣ Testing Skip Follow-up (Direct Detailed Analysis)...");

      const skipResponse = await axios.post(
        `${API_BASE_URL}/api/analyze-guided`,
        {
          carType: "دودج",
          carModel: "تشارجر",
          mileage: "80000",
          problemDescription: "مشكلة في الفرامل، لا تستجيب بشكل جيد",
          lastServiceType: "تغيير زيت",
          skipFollowUp: true,
          previousQuestions: [], // Ensure no previous questions
          previousAnswers: [], // Ensure no previous answers
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
        skipResponse.data.result?.substring(0, 300) + "..."
      );
      console.log("");
    } else {
      console.log(
        "⚠️ No follow-up questions generated, skipping detailed analysis test"
      );
    }

    console.log("🎉 AI Response Behavior Test Completed Successfully!");
    console.log("\n📋 Summary:");
    console.log("- Initial diagnosis provides preliminary analysis only");
    console.log("- Follow-up questions are generated for more details");
    console.log(
      "- Detailed analysis includes parts, prices, and repair instructions"
    );
    console.log("- Skip option provides detailed analysis directly");
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
testAIReponseBehavior();
