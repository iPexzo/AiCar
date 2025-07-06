// Test script for model-specific year validation
// Run this with: node test-year-validation.js

// Mock the validation functions for testing
const MODEL_YEAR_RANGES = {
  // Toyota models
  camry: { startYear: 1982, modelName: "Camry", brandName: "تويوتا" },
  corolla: { startYear: 1966, modelName: "Corolla", brandName: "تويوتا" },

  // Nissan models
  altima: { startYear: 1992, modelName: "Altima", brandName: "نيسان" },

  // Dodge models
  charger: { startYear: 2006, modelName: "Charger", brandName: "دودج" },
  challenger: { startYear: 1970, modelName: "Challenger", brandName: "دودج" },

  // Unknown model for fallback testing
  unknown: null,
};

const validateModelYear = (model, year) => {
  const currentYear = new Date().getFullYear();
  const modelKey = model.toLowerCase().trim();

  // Check if we have year range data for this model
  const yearRange = MODEL_YEAR_RANGES[modelKey];

  if (yearRange) {
    const { startYear, endYear, modelName } = yearRange;
    const maxYear = endYear || currentYear + 1; // Allow next year for new models

    if (year < startYear || year > maxYear) {
      return {
        isValid: false,
        message: `${modelName} was not manufactured in ${year} – please select a year between ${startYear} and ${maxYear}.`,
      };
    }
  } else {
    // Fallback to general validation for unknown models
    if (year < 1900 || year > currentYear + 1) {
      return {
        isValid: false,
        message: `Please select a year between 1900 and ${currentYear + 1}.`,
      };
    }
  }

  return { isValid: true };
};

const getModelYearRange = (model) => {
  const modelKey = model.toLowerCase().trim();
  return MODEL_YEAR_RANGES[modelKey] || null;
};

// Test cases
const testCases = [
  // Valid cases
  {
    model: "Camry",
    year: 2019,
    expected: true,
    description: "Valid Camry year",
  },
  {
    model: "Camry",
    year: 1982,
    expected: true,
    description: "Camry first year",
  },
  {
    model: "Altima",
    year: 1995,
    expected: true,
    description: "Valid Altima year",
  },
  {
    model: "Charger",
    year: 2010,
    expected: true,
    description: "Valid Charger year",
  },
  {
    model: "Challenger",
    year: 1975,
    expected: true,
    description: "Valid Challenger year",
  },

  // Invalid cases
  {
    model: "Camry",
    year: 1970,
    expected: false,
    description: "Camry before production start",
  },
  {
    model: "Camry",
    year: 3000,
    expected: false,
    description: "Camry future year",
  },
  {
    model: "Altima",
    year: 1990,
    expected: false,
    description: "Altima before production start",
  },
  {
    model: "Charger",
    year: 2000,
    expected: false,
    description: "Charger before production start",
  },
  {
    model: "Challenger",
    year: 1965,
    expected: false,
    description: "Challenger before production start",
  },

  // Unknown model fallback
  {
    model: "UnknownModel",
    year: 1800,
    expected: false,
    description: "Unknown model before 1900",
  },
  {
    model: "UnknownModel",
    year: 2020,
    expected: true,
    description: "Unknown model valid year",
  },
  {
    model: "UnknownModel",
    year: 3000,
    expected: false,
    description: "Unknown model future year",
  },
];

// Run tests
console.log("🧪 Testing Model-Specific Year Validation\n");

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = validateModelYear(testCase.model, testCase.year);
  const passed = result.isValid === testCase.expected;

  if (passed) {
    passedTests++;
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result.isValid}`);
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
  }
});

console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);

// Test year range info
console.log("\n📋 Model Year Range Information:");
const modelsToTest = ["camry", "altima", "charger", "challenger", "unknown"];
modelsToTest.forEach((model) => {
  const range = getModelYearRange(model);
  if (range) {
    const currentYear = new Date().getFullYear();
    const maxYear = range.endYear || currentYear + 1;
    console.log(`   ${range.modelName}: ${range.startYear} - ${maxYear}`);
  } else {
    console.log(
      `   ${model}: No specific data (fallback to 1900 - ${
        new Date().getFullYear() + 1
      })`
    );
  }
});

console.log("\n🎯 Year Validation Examples:");
const examples = [
  {
    model: "Camry",
    year: 1970,
    expected:
      "Camry was not manufactured in 1970 – please select a year between 1982 and 2025.",
  },
  {
    model: "Altima",
    year: 1990,
    expected:
      "Altima was not manufactured in 1990 – please select a year between 1992 and 2025.",
  },
  {
    model: "Charger",
    year: 2000,
    expected:
      "Charger was not manufactured in 2000 – please select a year between 2006 and 2025.",
  },
];

examples.forEach((example) => {
  const result = validateModelYear(example.model, example.year);
  console.log(`   ${example.model} ${example.year}: ${result.message}`);
});
