const axios = require("axios");

async function testRepairInstructionsVideos() {
  try {
    console.log("🧪 Testing repair instructions with videos functionality...");

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

      // Check for new repair instructions with videos
      if (response.data.repairInstructionsWithVideos) {
        console.log("📝 Repair instructions with videos:");
        response.data.repairInstructionsWithVideos.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.step}`);
          if (item.videoUrl) {
            console.log(`     🎥 Video: ${item.videoTitle || "No title"}`);
            console.log(`     🔗 URL: ${item.videoUrl}`);
          } else {
            console.log(`     ❌ No video found`);
          }
        });
      } else {
        console.log("❌ No repairInstructionsWithVideos in response");
      }

      // Check for required parts (should not have videos)
      if (response.data.requiredParts) {
        console.log("\n📦 Required parts (without videos):");
        response.data.requiredParts.forEach((part, index) => {
          console.log(`  ${index + 1}. ${part}`);
        });
      }

      // Check if old format still exists
      if (response.data.requiredPartsWithVideos) {
        console.log(
          "\n⚠️  WARNING: Old requiredPartsWithVideos still exists in response"
        );
      }

      console.log("\n📄 Response structure:");
      console.log("Keys in response:", Object.keys(response.data));
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

testRepairInstructionsVideos();
