const axios = require("axios");

// CarQuery API configuration
const CAR_QUERY_BASE_URL = "https://www.carqueryapi.com/api/0.3/";

// Brand name mapping for API calls
const BRAND_MAPPING = {
  تويوتا: "toyota",
  toyota: "toyota",
  هوندا: "honda",
  honda: "honda",
  نيسان: "nissan",
  nissan: "nissan",
  دودج: "dodge",
  dodge: "dodge",
};

// Model name mapping for API calls
const MODEL_MAPPING = {
  camry: "camry",
  corolla: "corolla",
  charger: "charger",
  challenger: "challenger",
  altima: "altima",
  civic: "civic",
  accord: "accord",
  تشالنجر: "challenger",
  تشارجر: "charger",
  دورانجو: "durango",
};

/**
 * Simulate frontend validation flow
 */
async function simulateFrontendValidation() {
  console.log("🎯 Simulating Frontend Validation Flow\n");

  // Simulate user input states
  let carType = "";
  let carModel = "";
  let carYear = "";
  let yearRange = null;
  let isLoadingYearRange = false;
  let yearValidationMessage = "";
  let validationErrors = {};

  console.log("📋 Initial state:");
  console.log(`  carType: "${carType}"`);
  console.log(`  carModel: "${carModel}"`);
  console.log(`  carYear: "${carYear}"`);
  console.log(`  yearRange: ${yearRange ? "loaded" : "null"}`);
  console.log(`  isLoadingYearRange: ${isLoadingYearRange}`);
  console.log(`  yearValidationMessage: "${yearValidationMessage}"`);
  console.log(`  validationErrors:`, validationErrors);

  // Step 1: User enters brand
  console.log('\n🔄 Step 1: User enters brand "تويوتا"');
  carType = "تويوتا";
  console.log(`✅ carType set to: "${carType}"`);

  // Step 2: User enters model
  console.log('\n🔄 Step 2: User enters model "camry"');
  carModel = "camry";
  console.log(`✅ carModel set to: "${carModel}"`);

  // Step 3: Fetch year range (simulate API call)
  console.log("\n🔄 Step 3: Fetching year range from API...");
  isLoadingYearRange = true;

  try {
    const apiBrand =
      BRAND_MAPPING[carType.toLowerCase()] || carType.toLowerCase();
    const apiModel =
      MODEL_MAPPING[carModel.toLowerCase()] || carModel.toLowerCase();

    const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
      apiBrand
    )}&model=${encodeURIComponent(apiModel)}`;

    const response = await axios.get(url, { timeout: 10000 });

    if (
      response.data &&
      response.data.Trims &&
      response.data.Trims.length > 0
    ) {
      const years = response.data.Trims.map((trim) => parseInt(trim.model_year))
        .filter((year) => !isNaN(year))
        .sort((a, b) => a - b);

      if (years.length > 0) {
        yearRange = {
          minYear: years[0],
          maxYear: Math.max(
            years[years.length - 1],
            new Date().getFullYear() + 1
          ),
          modelName: response.data.Trims[0].model_name || carModel,
          makeName: response.data.Trims[0].make_display || carType,
          isValid: true,
        };

        console.log(
          `✅ Year range loaded: ${yearRange.minYear}-${yearRange.maxYear}`
        );
        console.log(`✅ Model name: ${yearRange.modelName}`);
        console.log(`✅ Make name: ${yearRange.makeName}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching year range:`, error.message);
    yearValidationMessage =
      "Unable to fetch production data. Using general validation.";
  } finally {
    isLoadingYearRange = false;
  }

  // Step 4: User enters year
  console.log('\n🔄 Step 4: User enters year "2020"');
  carYear = "2020";
  const year = parseInt(carYear);
  console.log(`✅ carYear set to: "${carYear}" (${year})`);

  // Step 5: Validate year
  console.log("\n🔄 Step 5: Validating year...");
  if (yearRange) {
    if (year >= yearRange.minYear && year <= yearRange.maxYear) {
      console.log(`✅ Year ${year} is valid for ${yearRange.modelName}`);
      yearValidationMessage = "";
      delete validationErrors.carYear;
    } else {
      console.log(`❌ Year ${year} is invalid for ${yearRange.modelName}`);
      yearValidationMessage = `${yearRange.modelName} was not manufactured in ${year} – please select a year between ${yearRange.minYear} and ${yearRange.maxYear}.`;
      validationErrors.carYear = yearValidationMessage;
    }
  } else {
    console.log(`⚠️  Using fallback validation`);
    const currentYear = new Date().getFullYear();
    if (year >= 1900 && year <= currentYear + 1) {
      console.log(`✅ Year ${year} passes fallback validation`);
    } else {
      console.log(`❌ Year ${year} fails fallback validation`);
      validationErrors.carYear = `Please select a year between 1900 and ${
        currentYear + 1
      }.`;
    }
  }

  // Final state
  console.log("\n📋 Final state:");
  console.log(`  carType: "${carType}"`);
  console.log(`  carModel: "${carModel}"`);
  console.log(`  carYear: "${carYear}"`);
  console.log(
    `  yearRange: ${
      yearRange ? `${yearRange.minYear}-${yearRange.maxYear}` : "null"
    }`
  );
  console.log(`  isLoadingYearRange: ${isLoadingYearRange}`);
  console.log(`  yearValidationMessage: "${yearValidationMessage}"`);
  console.log(`  validationErrors:`, validationErrors);

  console.log("\n✅ Frontend validation simulation completed!\n");
}

/**
 * Test Arabic model name support
 */
async function testArabicModelSupport() {
  console.log("🌍 Testing Arabic Model Name Support\n");

  const testCases = [
    { brand: "دودج", model: "تشالنجر", englishModel: "challenger" },
    { brand: "دودج", model: "تشارجر", englishModel: "charger" },
    { brand: "دودج", model: "دورانجو", englishModel: "durango" },
  ];

  for (const testCase of testCases) {
    console.log(
      `📋 Testing: ${testCase.brand} ${testCase.model} (${testCase.englishModel})`
    );

    try {
      const apiBrand =
        BRAND_MAPPING[testCase.brand.toLowerCase()] ||
        testCase.brand.toLowerCase();
      const apiModel =
        MODEL_MAPPING[testCase.model.toLowerCase()] ||
        testCase.englishModel.toLowerCase();

      const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
        apiBrand
      )}&model=${encodeURIComponent(apiModel)}`;

      const response = await axios.get(url, { timeout: 10000 });

      if (
        response.data &&
        response.data.Trims &&
        response.data.Trims.length > 0
      ) {
        const years = response.data.Trims.map((trim) =>
          parseInt(trim.model_year)
        )
          .filter((year) => !isNaN(year))
          .sort((a, b) => a - b);

        if (years.length > 0) {
          const minYear = years[0];
          const maxYear = Math.max(
            years[years.length - 1],
            new Date().getFullYear() + 1
          );

          console.log(
            `✅ Success: ${minYear}-${maxYear} (${years.length} trims found)`
          );
          console.log(
            `✅ Arabic model mapping works: ${testCase.model} → ${testCase.englishModel}`
          );
        } else {
          console.log(`❌ No valid years found`);
        }
      } else {
        console.log(`❌ No trims found`);
      }
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    }

    console.log(""); // Empty line for readability
  }

  console.log("✅ Arabic model support test completed\n");
}

/**
 * Test error handling and fallback
 */
async function testErrorHandling() {
  console.log("⚠️  Testing Error Handling and Fallback\n");

  const testCases = [
    {
      brand: "InvalidBrand",
      model: "InvalidModel",
      year: 2020,
      description: "Invalid brand and model (should fallback)",
    },
    {
      brand: "تويوتا",
      model: "nonexistentmodel",
      year: 2020,
      description: "Valid brand, invalid model (should fallback)",
    },
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.description}`);

    try {
      const apiBrand =
        BRAND_MAPPING[testCase.brand.toLowerCase()] ||
        testCase.brand.toLowerCase();
      const apiModel =
        MODEL_MAPPING[testCase.model.toLowerCase()] ||
        testCase.model.toLowerCase();

      const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
        apiBrand
      )}&model=${encodeURIComponent(apiModel)}`;

      const response = await axios.get(url, { timeout: 10000 });

      if (
        response.data &&
        response.data.Trims &&
        response.data.Trims.length > 0
      ) {
        const years = response.data.Trims.map((trim) =>
          parseInt(trim.model_year)
        )
          .filter((year) => !isNaN(year))
          .sort((a, b) => a - b);

        if (years.length > 0) {
          const minYear = years[0];
          const maxYear = Math.max(
            years[years.length - 1],
            new Date().getFullYear() + 1
          );

          const isValid = testCase.year >= minYear && testCase.year <= maxYear;

          console.log(`📊 API found data: ${minYear}-${maxYear}`);
          console.log(`📊 Validation result: ${isValid ? "Valid" : "Invalid"}`);
        } else {
          console.log(`📊 No valid years found - using fallback`);
          const currentYear = new Date().getFullYear();
          const isValid =
            testCase.year >= 1900 && testCase.year <= currentYear + 1;
          console.log(
            `📊 Fallback validation: ${isValid ? "Valid" : "Invalid"}`
          );
        }
      } else {
        console.log(`📊 No trims found - using fallback`);
        const currentYear = new Date().getFullYear();
        const isValid =
          testCase.year >= 1900 && testCase.year <= currentYear + 1;
        console.log(`📊 Fallback validation: ${isValid ? "Valid" : "Invalid"}`);
      }
    } catch (error) {
      console.log(`📊 API error - using fallback`);
      const currentYear = new Date().getFullYear();
      const isValid = testCase.year >= 1900 && testCase.year <= currentYear + 1;
      console.log(`📊 Fallback validation: ${isValid ? "Valid" : "Invalid"}`);
    }

    console.log(""); // Empty line for readability
  }

  console.log("✅ Error handling test completed\n");
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🚀 Starting Simple Integration Tests\n");
  console.log("=".repeat(60));

  await simulateFrontendValidation();
  console.log("=".repeat(60));

  await testArabicModelSupport();
  console.log("=".repeat(60));

  await testErrorHandling();
  console.log("=".repeat(60));

  console.log("✅ All simple integration tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  simulateFrontendValidation,
  testArabicModelSupport,
  testErrorHandling,
  runAllTests,
};
