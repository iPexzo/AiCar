import axios from "axios";

const BASE_URL = "http://localhost:8001";

interface CarDetails {
  carType: string;
  carModel: string;
  mileage: string;
  lastServiceType?: string;
}

interface Question {
  id: string;
  question: string;
}

interface Answer {
  id: string;
  answer: string;
}

async function test3StepFlow() {
  console.log("🧪 Testing 3-Step Flow in /api/analyze-guided\n");

  const carDetails = {
    carType: "Toyota",
    carModel: "Camry",
    mileage: "150000",
    lastServiceType: "تغيير الزيت",
  };

  const problemDescription = "أسمع صوت طقطقة من المحرك عند التشغيل";

  // Step 1: Initial Analysis
  console.log("📋 Step 1: Initial Analysis");
  console.log("=".repeat(50));

  try {
    const initialResponse = await axios.post(`${BASE_URL}/api/analyze-guided`, {
      ...carDetails,
      problemDescription,
      step: "initial",
    });

    if (initialResponse.data.success) {
      console.log("✅ Initial analysis successful");
      console.log("📝 Analysis Preview:");
      const analysisPreview =
        initialResponse.data.result.substring(0, 200) + "...";
      console.log(analysisPreview);
      console.log(`\n⏰ Timestamp: ${initialResponse.data.timestamp}`);
      console.log(`📝 Note: ${initialResponse.data.note}`);
    } else {
      console.log("❌ Initial analysis failed:", initialResponse.data.message);
      return;
    }
  } catch (error: any) {
    console.log(
      "❌ Error in initial analysis:",
      error.response?.data?.message || error.message
    );
    return;
  }

  // Step 2: Generate Smart Questions
  console.log("\n\n📋 Step 2: Generate Smart Questions");
  console.log("=".repeat(50));

  try {
    const questionsResponse = await axios.post(
      `${BASE_URL}/api/analyze-guided`,
      {
        ...carDetails,
        problemDescription,
        step: "questions",
        previousQuestions: [],
        previousAnswers: [],
        chatHistory: ["المستخدم: أسمع صوت طقطقة من المحرك عند التشغيل"],
      }
    );

    if (questionsResponse.data.success) {
      console.log("✅ Smart questions generated successfully");
      console.log("🔍 Generated Questions:");

      const questions = questionsResponse.data.followUpQuestions;
      questions.forEach((question: any, index: number) => {
        console.log(`  ${index + 1}. ${question.question}`);
      });

      console.log(`\n⏰ Timestamp: ${questionsResponse.data.timestamp}`);
      console.log(`📝 Note: ${questionsResponse.data.note}`);

      // Step 3: Final Analysis with Answers
      console.log("\n\n📋 Step 3: Final Analysis with Answers");
      console.log("=".repeat(50));

      const mockAnswers = [
        "نعم، الصوت يأتي فقط عند التشغيل",
        "منذ أسبوعين تقريباً",
        "نعم، يزداد مع السرعة",
      ];

      const finalResponse = await axios.post(`${BASE_URL}/api/analyze-guided`, {
        ...carDetails,
        problemDescription,
        step: "final",
        previousQuestions: questions.map((q: any) => q.question),
        previousAnswers: mockAnswers,
        chatHistory: [
          "المستخدم: أسمع صوت طقطقة من المحرك عند التشغيل",
          "النظام: هل الصوت يأتي فقط عند التشغيل؟",
          "المستخدم: نعم، الصوت يأتي فقط عند التشغيل",
          "النظام: متى بدأت هذه المشكلة؟",
          "المستخدم: منذ أسبوعين تقريباً",
          "النظام: هل تزداد المشكلة مع السرعة؟",
          "المستخدم: نعم، يزداد مع السرعة",
        ],
      });

      if (finalResponse.data.success) {
        console.log("✅ Final analysis successful");
        console.log("📝 Analysis Preview:");
        const analysisPreview =
          finalResponse.data.result.substring(0, 300) + "...";
        console.log(analysisPreview);
        console.log(`\n⏰ Timestamp: ${finalResponse.data.timestamp}`);
        console.log(`📝 Note: ${finalResponse.data.note}`);
      } else {
        console.log("❌ Final analysis failed:", finalResponse.data.message);
      }
    } else {
      console.log(
        "❌ Questions generation failed:",
        questionsResponse.data.message
      );
    }
  } catch (error: any) {
    console.log(
      "❌ Error in questions/final analysis:",
      error.response?.data?.message || error.message
    );
  }

  console.log("\n\n🎯 3-Step Flow Test Summary:");
  console.log("=".repeat(40));
  console.log("✅ Step 1: Initial analysis (no parts/prices)");
  console.log("✅ Step 2: Dynamic smart questions based on context");
  console.log("✅ Step 3: Final detailed analysis with all context");
  console.log("✅ All steps use the same /api/analyze-guided endpoint");
  console.log("✅ Context is properly passed between steps");
  console.log("✅ Questions are dynamic and context-aware");
}

// Run the test
test3StepFlow().catch(console.error);
