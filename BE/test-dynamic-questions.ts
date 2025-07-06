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

async function testDynamicQuestions() {
  console.log("🧪 Testing Dynamic Smart Questions Generation\n");

  const testCases = [
    {
      name: "Engine Noise - Initial",
      data: {
        carType: "Toyota",
        carModel: "Camry",
        mileage: "150000",
        problemDescription: "أسمع صوت طقطقة من المحرك عند التشغيل",
      },
    },
    {
      name: "Engine Noise - With Chat History",
      data: {
        carType: "Toyota",
        carModel: "Camry",
        mileage: "150000",
        problemDescription: "أسمع صوت طقطقة من المحرك عند التشغيل",
        previousQuestions: ["هل الصوت يأتي فقط عند التشغيل؟"],
        previousAnswers: ["نعم، فقط عند التشغيل"],
        chatHistory: [
          "المستخدم: أسمع صوت طقطقة من المحرك عند التشغيل",
          "النظام: هل الصوت يأتي فقط عند التشغيل؟",
          "المستخدم: نعم، فقط عند التشغيل",
        ],
      },
    },
    {
      name: "Brake Problem - Initial",
      data: {
        carType: "Nissan",
        carModel: "Altima",
        mileage: "120000",
        problemDescription: "الفرامل لا تعمل بشكل جيد - تحتاج قوة أكبر للضغط",
      },
    },
    {
      name: "Brake Problem - With Chat History",
      data: {
        carType: "Nissan",
        carModel: "Altima",
        mileage: "120000",
        problemDescription: "الفرامل لا تعمل بشكل جيد - تحتاج قوة أكبر للضغط",
        previousQuestions: ["متى آخر مرة تم تغيير زيت الفرامل؟"],
        previousAnswers: ["منذ سنة تقريباً"],
        chatHistory: [
          "المستخدم: الفرامل لا تعمل بشكل جيد",
          "النظام: متى آخر مرة تم تغيير زيت الفرامل؟",
          "المستخدم: منذ سنة تقريباً",
        ],
      },
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test Case ${i + 1}: ${testCase.name}`);
    console.log("=".repeat(60));

    try {
      let response;

      if (
        testCase.data.previousQuestions &&
        testCase.data.previousQuestions.length > 0
      ) {
        // Use generate-questions endpoint for follow-up questions
        console.log("🔄 Using /api/generate-questions endpoint");
        response = await axios.post(`${BASE_URL}/api/generate-questions`, {
          carDetails: {
            carType: testCase.data.carType,
            carModel: testCase.data.carModel,
            mileage: testCase.data.mileage,
          },
          problemDescription: testCase.data.problemDescription,
          previousQuestions: testCase.data.previousQuestions,
          previousAnswers: testCase.data.previousAnswers,
          chatHistory: testCase.data.chatHistory || [],
        });
      } else {
        // Use analyze-guided endpoint for initial questions
        console.log("🔄 Using /api/analyze-guided endpoint");
        response = await axios.post(`${BASE_URL}/api/analyze-guided`, {
          carType: testCase.data.carType,
          carModel: testCase.data.carModel,
          mileage: testCase.data.mileage,
          problemDescription: testCase.data.problemDescription,
        });
      }

      if (response.data.success) {
        console.log("✅ Questions generated successfully");
        console.log("🔍 Generated Questions:");

        const questions =
          response.data.followUpQuestions || response.data.questions;
        questions.forEach((question: any, index: number) => {
          console.log(`  ${index + 1}. ${question.question}`);
        });

        console.log(`\n⏰ Timestamp: ${response.data.timestamp}`);
        console.log(`📝 Note: ${response.data.note}`);

        // Check if questions are different from previous ones
        if (
          testCase.data.previousQuestions &&
          testCase.data.previousQuestions.length > 0
        ) {
          const previousQuestions = testCase.data.previousQuestions;
          const newQuestions = questions.map((q: any) => q.question);

          const hasDuplicates = newQuestions.some((newQ: string) =>
            previousQuestions.some(
              (prevQ: string) =>
                newQ.toLowerCase().includes(prevQ.toLowerCase()) ||
                prevQ.toLowerCase().includes(newQ.toLowerCase())
            )
          );

          if (hasDuplicates) {
            console.log(
              "⚠️  WARNING: Some questions might be similar to previous ones"
            );
          } else {
            console.log(
              "✅ All questions are unique and different from previous ones"
            );
          }
        }
      } else {
        console.log("❌ Failed to get questions:", response.data.message);
      }
    } catch (error: any) {
      console.log("❌ Error:", error.response?.data?.message || error.message);
    }

    // Wait between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("\n\n🎯 Dynamic Questions Test Summary:");
  console.log("=".repeat(50));
  console.log("✅ Questions should be different for each context");
  console.log("✅ Questions should use chat history when available");
  console.log(
    "✅ Questions should be context-aware based on problem description"
  );
  console.log("✅ No duplicate questions should be generated");
  console.log("✅ All questions should be in Arabic");
  console.log("✅ Questions should be more specific with more context");
}

// Run the test
testDynamicQuestions().catch(console.error);
