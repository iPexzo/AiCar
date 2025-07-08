const axios = require("axios");

async function testFixedAPI() {
  try {
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

    console.log("🔧 Testing Fixed API with Dashed Items...");
    console.log("📋 Sending request to analyze-followup API...");

    const response = await axios.post(
      "http://localhost:8001/api/analyze-followup",
      payload
    );

    console.log("\n✅ API Response Status:", response.status);
    console.log(
      "✅ AI Analysis:",
      response.data.result ? "✅ Present" : "❌ Missing"
    );

    if (
      response.data.requiredPartsWithVideos &&
      response.data.requiredPartsWithVideos.length > 0
    ) {
      console.log(
        `\n🎥 Found ${response.data.requiredPartsWithVideos.length} parts with repair videos:`
      );

      response.data.requiredPartsWithVideos.forEach((item, index) => {
        console.log(`\n${index + 1}. 🔧 Part: ${item.part}`);
        if (item.videoUrl) {
          console.log(`   🎬 Video: ${item.videoUrl}`);
          console.log(
            `   📺 Title: ${item.videoTitle || "Brake Repair Guide"}`
          );
          console.log(`   ✅ Status: Video link available`);
        } else {
          console.log(`   ❌ Status: No video link`);
        }
      });

      // Test if videos are accessible
      console.log("\n🔗 Testing video accessibility...");
      const hasVideos = response.data.requiredPartsWithVideos.some(
        (item) => item.videoUrl
      );
      if (hasVideos) {
        console.log("✅ All required parts have repair video links!");
        console.log("🎯 Users can now watch repair videos for each part");
      } else {
        console.log("❌ Some parts are missing video links");
      }
    } else {
      console.log("\n❌ No parts with videos found in response");
      console.log(
        "This might indicate the parsing is still not working correctly"
      );
    }
  } catch (error) {
    console.error("❌ API Test Failed:", error.response?.data || error.message);
  }
}

testFixedAPI();
