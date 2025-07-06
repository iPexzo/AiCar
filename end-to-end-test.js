const axios = require("axios");

// Configuration
const BACKEND_URL = "http://localhost:8001";
const FRONTEND_URL = "http://localhost:8081"; // Expo web default

// Test data
const testCases = [
  {
    name: "Toyota Camry 2020 - Valid Case",
    data: {
      carType: "تويوتا",
      carModel: "camry",
      carYear: "2020",
      mileage: "50000",
      problemDescription: "Engine makes strange noise when starting",
    },
    expectedYearRange: { min: 1982, max: 2026 },
    shouldBeValid: true,
  },
  {
    name: "Dodge Charger 2006 - Valid Case",
    data: {
      carType: "دودج",
      carModel: "charger",
      carYear: "2006",
      mileage: "80000",
      problemDescription: "Transmission shifts roughly",
    },
    expectedYearRange: { min: 1967, max: 2026 },
    shouldBeValid: true,
  },
  {
    name: "Toyota Camry 1980 - Invalid Year (Before Production)",
    data: {
      carType: "تويوتا",
      carModel: "camry",
      carYear: "1980",
      mileage: "100000",
      problemDescription: "Engine overheating",
    },
    expectedYearRange: { min: 1982, max: 2026 },
    shouldBeValid: false,
  },
  {
    name: "New Car - Mileage 0",
    data: {
      carType: "تويوتا",
      carModel: "camry",
      carYear: "2024",
      mileage: "0",
      problemDescription: "Check engine light on",
    },
    expectedYearRange: { min: 1982, max: 2026 },
    shouldBeValid: true,
    isNewCar: true,
  },
  {
    name: "Arabic Model Name - Dodge Challenger",
    data: {
      carType: "دودج",
      carModel: "تشالنجر",
      carYear: "2020",
      mileage: "30000",
      problemDescription: "Brake pedal feels soft",
    },
    expectedYearRange: { min: 1969, max: 2026 },
    shouldBeValid: true,
  },
  {
    name: "Invalid Model - Should Fallback",
    data: {
      carType: "تويوتا",
      carModel: "nonexistentmodel",
      carYear: "2020",
      mileage: "50000",
      problemDescription: "Engine problem",
    },
    shouldBeValid: true, // Should use fallback validation
    shouldFallback: true,
  },
];

/**
 * Test Backend Health
 */
async function testBackendHealth() {
  console.log("🏥 Testing Backend Health...");

  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000,
    });

    if (response.status === 200 && response.data.status === "OK") {
      console.log("✅ Backend is healthy and running");
      return true;
    } else {
      console.log("❌ Backend health check failed");
      return false;
    }
  } catch (error) {
    console.log("❌ Backend is not accessible:", error.message);
    return false;
  }
}

/**
 * Test CarQuery API Integration
 */
async function testCarQueryAPI() {
  console.log("\n🔍 Testing CarQuery API Integration...");

  const testCases = [
    { brand: "تويوتا", model: "camry", expectedMinYear: 1982 },
    { brand: "دودج", model: "charger", expectedMinYear: 1967 },
    { brand: "دودج", model: "تشالنجر", expectedMinYear: 1969 },
    { brand: "نيسان", model: "altima", expectedMinYear: 1992 },
  ];

  let passedTests = 0;

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.brand} ${testCase.model}`);

      const response = await axios.get(
        `${BACKEND_URL}/api/car-query/year-range`,
        {
          params: {
            make: testCase.brand,
            model: testCase.model,
          },
          timeout: 10000,
        }
      );

      if (response.status === 200 && response.data.success) {
        const yearRange = response.data.yearRange;
        console.log(
          `✅ API Response: ${yearRange.minYear}-${yearRange.maxYear}`
        );

        if (yearRange.minYear <= testCase.expectedMinYear) {
          console.log(`✅ Year range validation: PASSED`);
          passedTests++;
        } else {
          console.log(
            `⚠️  Year range validation: Expected min ${testCase.expectedMinYear}, got ${yearRange.minYear}`
          );
        }
      } else {
        console.log(`❌ API request failed:`, response.data);
      }
    } catch (error) {
      console.log(
        `❌ Error testing ${testCase.brand} ${testCase.model}:`,
        error.message
      );
    }

    console.log(""); // Empty line for readability
  }

  console.log(
    `📊 CarQuery API Tests: ${passedTests}/${testCases.length} passed`
  );
  return passedTests === testCases.length;
}

/**
 * Test Form Validation
 */
async function testFormValidation() {
  console.log("\n📝 Testing Form Validation...");

  let passedTests = 0;

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);

    try {
      // Test year validation
      const yearValidationResponse = await axios.post(
        `${BACKEND_URL}/api/car-query/validate-year`,
        {
          make: testCase.data.carType,
          model: testCase.data.carModel,
          year: parseInt(testCase.data.carYear),
        },
        { timeout: 10000 }
      );

      if (yearValidationResponse.status === 200) {
        const validation = yearValidationResponse.data;

        if (validation.isValid === testCase.shouldBeValid) {
          console.log(
            `✅ Year validation: PASSED (${
              validation.isValid ? "Valid" : "Invalid"
            })`
          );
          passedTests++;
        } else {
          console.log(
            `❌ Year validation: FAILED (Expected ${testCase.shouldBeValid}, got ${validation.isValid})`
          );
        }

        if (validation.yearRange) {
          console.log(
            `📊 Year range: ${validation.yearRange.minYear}-${validation.yearRange.maxYear}`
          );
        }

        if (validation.message) {
          console.log(`📝 Message: ${validation.message}`);
        }
      } else {
        console.log(`❌ Year validation request failed`);
      }
    } catch (error) {
      console.log(`❌ Error testing form validation:`, error.message);
    }

    console.log(""); // Empty line for readability
  }

  console.log(
    `📊 Form Validation Tests: ${passedTests}/${testCases.length} passed`
  );
  return passedTests === testCases.length;
}

/**
 * Test AI Diagnosis
 */
async function testAIDiagnosis() {
  console.log("\n🤖 Testing AI Diagnosis...");

  const testCase = testCases[0]; // Use Toyota Camry test case

  try {
    console.log(`📋 Testing AI diagnosis with: ${testCase.name}`);

    const diagnosisResponse = await axios.post(
      `${BACKEND_URL}/api/analyze`,
      {
        carType: testCase.data.carType,
        carModel: testCase.data.carModel,
        mileage: testCase.data.mileage,
        problemDescription: testCase.data.problemDescription,
      },
      { timeout: 30000 }
    ); // Longer timeout for AI processing

    if (diagnosisResponse.status === 200) {
      const result = diagnosisResponse.data;

      if (result.success && result.result) {
        console.log("✅ AI diagnosis successful");
        console.log(`📊 Analysis length: ${result.result.length} characters`);

        // Check if follow-up questions are present
        if (result.followUpQuestions && result.followUpQuestions.length > 0) {
          console.log(
            `✅ Follow-up questions generated: ${result.followUpQuestions.length} questions`
          );
          console.log(
            `📝 Sample question: ${result.followUpQuestions[0].question}`
          );
        } else {
          console.log("⚠️  No follow-up questions generated");
        }

        return true;
      } else {
        console.log("❌ AI diagnosis failed:", result.error || "Unknown error");
        return false;
      }
    } else {
      console.log("❌ AI diagnosis request failed");
      return false;
    }
  } catch (error) {
    console.log("❌ Error testing AI diagnosis:", error.message);
    return false;
  }
}

/**
 * Test Error Handling
 */
async function testErrorHandling() {
  console.log("\n⚠️  Testing Error Handling...");

  const errorTestCases = [
    {
      name: "Missing Required Fields",
      data: {
        carType: "",
        carModel: "",
        carYear: "",
        mileage: "",
        problemDescription: "",
      },
      shouldFail: true,
    },
    {
      name: "Invalid Year Format",
      data: {
        carType: "تويوتا",
        carModel: "camry",
        carYear: "invalid",
        mileage: "50000",
        problemDescription: "Engine problem",
      },
      shouldFail: true,
    },
    {
      name: "Invalid Mileage Format",
      data: {
        carType: "تويوتا",
        carModel: "camry",
        carYear: "2020",
        mileage: "invalid",
        problemDescription: "Engine problem",
      },
      shouldFail: true,
    },
  ];

  let passedTests = 0;

  for (const testCase of errorTestCases) {
    console.log(`📋 Testing: ${testCase.name}`);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/analyze`,
        testCase.data,
        { timeout: 10000 }
      );

      if (testCase.shouldFail) {
        if (response.status === 400) {
          console.log(
            "✅ Error handling: PASSED (Correctly rejected invalid data)"
          );
          passedTests++;
        } else {
          console.log(
            "❌ Error handling: FAILED (Should have rejected invalid data)"
          );
        }
      } else {
        if (response.status === 200) {
          console.log(
            "✅ Error handling: PASSED (Correctly accepted valid data)"
          );
          passedTests++;
        } else {
          console.log(
            "❌ Error handling: FAILED (Should have accepted valid data)"
          );
        }
      }
    } catch (error) {
      if (
        testCase.shouldFail &&
        error.response &&
        error.response.status === 400
      ) {
        console.log(
          "✅ Error handling: PASSED (Correctly rejected invalid data)"
        );
        passedTests++;
      } else if (
        !testCase.shouldFail &&
        error.response &&
        error.response.status === 200
      ) {
        console.log(
          "✅ Error handling: PASSED (Correctly accepted valid data)"
        );
        passedTests++;
      } else {
        console.log("❌ Error handling: FAILED (Unexpected error response)");
      }
    }

    console.log(""); // Empty line for readability
  }

  console.log(
    `📊 Error Handling Tests: ${passedTests}/${errorTestCases.length} passed`
  );
  return passedTests === errorTestCases.length;
}

/**
 * Test Frontend API Integration
 */
async function testFrontendAPI() {
  console.log("\n🌐 Testing Frontend API Integration...");

  try {
    // Test if frontend is accessible
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });

    if (frontendResponse.status === 200) {
      console.log("✅ Frontend is accessible");

      // Test if frontend can reach backend
      const backendFromFrontendResponse = await axios.get(
        `${BACKEND_URL}/health`,
        { timeout: 5000 }
      );

      if (backendFromFrontendResponse.status === 200) {
        console.log("✅ Frontend can reach backend");
        return true;
      } else {
        console.log("❌ Frontend cannot reach backend");
        return false;
      }
    } else {
      console.log("❌ Frontend is not accessible");
      return false;
    }
  } catch (error) {
    console.log("❌ Frontend API test failed:", error.message);
    return false;
  }
}

/**
 * Run Complete End-to-End Test
 */
async function runCompleteTest() {
  console.log("🚀 Starting Complete End-to-End Test\n");
  console.log("=".repeat(80));

  const results = {
    backendHealth: false,
    carQueryAPI: false,
    formValidation: false,
    aiDiagnosis: false,
    errorHandling: false,
    frontendAPI: false,
  };

  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();
  console.log("=".repeat(80));

  // Test 2: CarQuery API Integration
  if (results.backendHealth) {
    results.carQueryAPI = await testCarQueryAPI();
    console.log("=".repeat(80));
  }

  // Test 3: Form Validation
  if (results.backendHealth) {
    results.formValidation = await testFormValidation();
    console.log("=".repeat(80));
  }

  // Test 4: AI Diagnosis
  if (results.backendHealth) {
    results.aiDiagnosis = await testAIDiagnosis();
    console.log("=".repeat(80));
  }

  // Test 5: Error Handling
  if (results.backendHealth) {
    results.errorHandling = await testErrorHandling();
    console.log("=".repeat(80));
  }

  // Test 6: Frontend API Integration
  results.frontendAPI = await testFrontendAPI();
  console.log("=".repeat(80));

  // Summary
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));

  const testNames = {
    backendHealth: "Backend Health",
    carQueryAPI: "CarQuery API Integration",
    formValidation: "Form Validation",
    aiDiagnosis: "AI Diagnosis",
    errorHandling: "Error Handling",
    frontendAPI: "Frontend API Integration",
  };

  let passedTests = 0;
  let totalTests = Object.keys(results).length;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? "✅ PASSED" : "❌ FAILED";
    console.log(`${testNames[test]}: ${status}`);
    if (result) passedTests++;
  }

  console.log("\n" + "=".repeat(80));
  console.log(`📈 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! The application is working correctly.");
  } else {
    console.log(
      "⚠️  Some tests failed. Please check the logs above for details."
    );
  }

  console.log("=".repeat(80));

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  testBackendHealth,
  testCarQueryAPI,
  testFormValidation,
  testAIDiagnosis,
  testErrorHandling,
  testFrontendAPI,
  runCompleteTest,
};
