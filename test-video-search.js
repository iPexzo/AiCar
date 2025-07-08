const axios = require("axios");

async function testVideoSearch() {
  try {
    console.log("🧪 Testing video search functionality...");

    const payload = {
      initialAnalysis: "مشكلة في الفرامل",
      followUpQuestions: [{ question: "هل تسمع صوت عند الضغط على الفرامل؟" }],
      followUpAnswers: ["نعم، صوت صرير"],
      carDetails: {
        brand: "Toyota",
        model: "Camry",
        year: 2020,
        mileage: 50000,
        problemDescription: "مشكلة في الفرامل",
      },
    };

    console.log("📤 Sending request to analyze-followup...");
    const response = await axios.post(
      "http://localhost:8001/api/analyze-followup",
      payload,
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Response received!");
    console.log("📊 Response status:", response.status);

    if (response.data.success) {
      console.log("🎯 Analysis successful!");
      console.log("📝 Required parts with videos:");

      if (
        response.data.requiredPartsWithVideos &&
        response.data.requiredPartsWithVideos.length > 0
      ) {
        response.data.requiredPartsWithVideos.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.part}`);
          if (item.videoUrl) {
            console.log(`     🎥 Video: ${item.videoTitle || "No title"}`);
            console.log(`     🔗 URL: ${item.videoUrl}`);
          } else {
            console.log(`     ❌ No video found`);
          }
        });
      } else {
        console.log("❌ No required parts with videos found");
      }

      console.log("\n📄 Full AI response preview:");
      console.log(response.data.result.substring(0, 500) + "...");
    } else {
      console.log("❌ Analysis failed:", response.data.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testVideoSearch();
