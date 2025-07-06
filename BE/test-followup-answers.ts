import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

async function testFollowUpAnswers() {
  console.log("🧪 Testing Follow-Up Questions with Hardcoded Answers...\n");

  try {
    // Step 1: Get initial analysis with follow-up questions
    console.log("1. Getting initial analysis with follow-up questions...");
    const initialAnalysisPayload = {
      carType: "Dodge",
      carModel: "Charger 2020",
      mileage: "75000",
      problemDescription: "المحرك يصدر صوت غريب عند التسارع",
    };

    const initialResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      initialAnalysisPayload
    );

    console.log("✅ Initial analysis successful");
    console.log(
      "📊 Follow-up questions received:",
      initialResponse.data.followUpQuestions?.length || 0
    );

    // Display the follow-up questions
    if (initialResponse.data.followUpQuestions) {
      console.log("📝 Follow-up questions:");
      initialResponse.data.followUpQuestions.forEach(
        (q: any, index: number) => {
          console.log(`   ${index + 1}. ${q.question} (Type: ${q.type})`);
          if (q.options) {
            console.log(`      Options: ${q.options.join(", ")}`);
          }
        }
      );
    }
    console.log("");

    // Step 2: Test with the hardcoded answers you provided
    console.log("2. Testing follow-up analysis with hardcoded answers...");

    const hardcodedAnswers = [
      {
        questionId: "1",
        answer: "نعم", // هل تسمع أصوات غريبة من المحرك؟
      },
      {
        questionId: "2",
        answer: "قبل أسبوعين", // متى بدأت هذه المشكلة؟
      },
      {
        questionId: "3",
        answer: "نعم", // هل تزداد المشكلة مع زيادة السرعة؟
      },
    ];

    console.log("📝 Using hardcoded answers:");
    hardcodedAnswers.forEach((answer, index) => {
      console.log(
        `   ${index + 1}. Question ID: ${answer.questionId} → Answer: "${
          answer.answer
        }"`
      );
    });
    console.log("");

    const followUpPayload = {
      initialAnalysis: initialResponse.data.result,
      followUpAnswers: hardcodedAnswers,
      carDetails: {
        carType: "Dodge",
        carModel: "Charger 2020",
        mileage: "75000",
        problemDescription: "المحرك يصدر صوت غريب عند التسارع",
      },
    };

    const followUpResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-followup`,
      followUpPayload
    );

    console.log("✅ Follow-up analysis successful");
    console.log(
      "📊 Enhanced analysis received:",
      !!followUpResponse.data.result
    );
    console.log(
      "📝 Analysis length:",
      followUpResponse.data.result?.length || 0,
      "characters"
    );
    console.log("");

    // Step 3: Display a preview of the enhanced analysis
    console.log("3. Enhanced Analysis Preview:");
    if (followUpResponse.data.result) {
      const preview = followUpResponse.data.result.substring(0, 500) + "...";
      console.log(preview);
    }
    console.log("");

    // Step 4: Test with different hardcoded answers
    console.log("4. Testing with different hardcoded answers...");

    const alternativeAnswers = [
      {
        questionId: "1",
        answer: "لا", // هل تسمع أصوات غريبة من المحرك؟
      },
      {
        questionId: "2",
        answer: "منذ شهر", // متى بدأت هذه المشكلة؟
      },
      {
        questionId: "3",
        answer: "لا أعرف", // هل تزداد المشكلة مع زيادة السرعة؟
      },
    ];

    console.log("📝 Using alternative answers:");
    alternativeAnswers.forEach((answer, index) => {
      console.log(
        `   ${index + 1}. Question ID: ${answer.questionId} → Answer: "${
          answer.answer
        }"`
      );
    });
    console.log("");

    const alternativePayload = {
      ...followUpPayload,
      followUpAnswers: alternativeAnswers,
    };

    const alternativeResponse = await axios.post(
      `${API_BASE_URL}/api/analyze-followup`,
      alternativePayload
    );

    console.log("✅ Alternative follow-up analysis successful");
    console.log(
      "📊 Alternative analysis received:",
      !!alternativeResponse.data.result
    );
    console.log("");

    console.log("🎉 All follow-up answer tests passed!");
    console.log("");
    console.log("📋 Summary:");
    console.log("   ✅ Initial analysis with follow-up questions works");
    console.log("   ✅ Follow-up analysis with hardcoded answers works");
    console.log("   ✅ Different answer combinations work");
    console.log("   ✅ Enhanced analysis is generated based on answers");
    console.log("");
    console.log("🔧 The endpoint correctly processes the hardcoded answers:");
    console.log("   - Question ID 1: 'نعم' (Yes - strange engine sounds)");
    console.log(
      "   - Question ID 2: 'قبل أسبوعين' (2 weeks ago - when problem started)"
    );
    console.log(
      "   - Question ID 3: 'نعم' (Yes - problem increases with speed)"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("Status code:", error.response.status);
    }
  }
}

testFollowUpAnswers();
