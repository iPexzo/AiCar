// Test script for car validation system
// This simulates the validation logic from HomeScreen.tsx

// Car brand mapping (copied from the actual implementation)
const CAR_BRANDS = {
  // Toyota models
  camry: "تويوتا",
  corolla: "تويوتا",
  rav4: "تويوتا",
  highlander: "تويوتا",
  "land cruiser": "تويوتا",
  prado: "تويوتا",
  fortuner: "تويوتا",
  hilux: "تويوتا",
  yaris: "تويوتا",
  avalon: "تويوتا",
  prius: "تويوتا",

  // Honda models
  civic: "هوندا",
  accord: "هوندا",
  "cr-v": "هوندا",
  pilot: "هوندا",
  odyssey: "هوندا",
  fit: "هوندا",

  // Nissan models
  altima: "نيسان",
  sentra: "نيسان",
  rogue: "نيسان",
  murano: "نيسان",
  pathfinder: "نيسان",
  maxima: "نيسان",

  // Hyundai models
  elantra: "هيونداي",
  sonata: "هيونداي",
  tucson: "هيونداي",
  "santa fe": "هيونداي",
  accent: "هيونداي",
  veloster: "هيونداي",

  // Kia models
  forte: "كيا",
  optima: "كيا",
  sportage: "كيا",
  sorento: "كيا",
  rio: "كيا",
  soul: "كيا",

  // Ford models
  focus: "فورد",
  fusion: "فورد",
  escape: "فورد",
  explorer: "فورد",
  "f-150": "فورد",
  mustang: "فورد",

  // Chevrolet models
  cruze: "شيفروليه",
  malibu: "شيفروليه",
  equinox: "شيفروليه",
  tahoe: "شيفروليه",
  silverado: "شيفروليه",
  camaro: "شيفروليه",

  // BMW models
  "3 series": "بي إم دبليو",
  "5 series": "بي إم دبليو",
  x3: "بي إم دبليو",
  x5: "بي إم دبليو",
  m3: "بي إم دبليو",
  m5: "بي إم دبليو",

  // Mercedes models
  "c-class": "مرسيدس",
  "e-class": "مرسيدس",
  "s-class": "مرسيدس",
  gla: "مرسيدس",
  glc: "مرسيدس",
  gle: "مرسيدس",

  // Audi models
  a3: "أودي",
  a4: "أودي",
  a6: "أودي",
  q3: "أودي",
  q5: "أودي",
  q7: "أودي",

  // Lexus models
  es: "لكزس",
  is: "لكزس",
  rx: "لكزس",
  nx: "لكزس",
  ls: "لكزس",
  gs: "لكزس",

  // Dodge models
  charger: "دودج",
  challenger: "دودج",
  durango: "دودج",
  journey: "دودج",
  ram: "دودج",
  dart: "دودج",
  caliber: "دودج",
  nitro: "دودج",
  // Arabic variations for Dodge models
  تشالنجر: "دودج",
  تشارجر: "دودج",
  دورانجو: "دودج",
  جورني: "دودج",
  دارت: "دودج",
  كاليبر: "دودج",
  نايترو: "دودج",
};

// Helper function for fuzzy string matching (Levenshtein distance)
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

// Helper function to find closest match
const findClosestMatch = (input, options) => {
  let closestMatch = null;
  let minDistance = Infinity;

  for (const option of options) {
    const distance = levenshteinDistance(
      input.toLowerCase(),
      option.toLowerCase()
    );
    if (distance < minDistance && distance <= 3) {
      // Allow up to 3 character differences
      minDistance = distance;
      closestMatch = option;
    }
  }

  return closestMatch ? { match: closestMatch, distance: minDistance } : null;
};

// Car input validation and parsing utility
const parseCarInput = (carTypeInput, carModelInput) => {
  const suggestions = [];
  const warnings = [];

  let brand = "";
  let model = "";
  let year = undefined;
  let isNew = false;

  // Combine inputs for analysis
  const combinedInput = `${carTypeInput} ${carModelInput}`.trim().toLowerCase();

  // Extract year from combined input (look for 4-digit year)
  const yearMatch = combinedInput.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear + 1) {
      warnings.push(`سنة ${year} غير صحيحة. يرجى التأكد من السنة.`);
      year = undefined;
    } else if (year === currentYear || year === currentYear + 1) {
      isNew = true;
    }
  }

  // Try to extract brand and model from combined input
  const words = combinedInput
    .replace(/\b(19|20)\d{2}\b/g, "")
    .trim()
    .split(/\s+/);

  if (words.length >= 2) {
    // Check if first word is a known brand
    const firstWord = words[0];
    const remainingWords = words.slice(1).join(" ");

    if (CAR_BRANDS[firstWord] || CAR_BRANDS[`${firstWord} ${words[1]}`]) {
      brand = CAR_BRANDS[firstWord] || CAR_BRANDS[`${firstWord} ${words[1]}`];
      model = remainingWords;
    } else {
      // Check if any word matches a known model
      let modelFound = false;
      for (const word of words) {
        if (CAR_BRANDS[word]) {
          brand = CAR_BRANDS[word];
          model = words.filter((w) => w !== word).join(" ");
          modelFound = true;
          break;
        }
      }

      // If no exact match found, try fuzzy matching for each word
      if (!modelFound) {
        for (const word of words) {
          const modelOptions = Object.keys(CAR_BRANDS);
          const closestMatch = findClosestMatch(word, modelOptions);

          if (closestMatch) {
            brand = CAR_BRANDS[closestMatch.match];
            model = closestMatch.match;
            const otherWords = words.filter((w) => w !== word).join(" ");
            if (otherWords) {
              model += ` ${otherWords}`;
            }
            suggestions.push(
              `تم تصحيح "${word}" إلى "${closestMatch.match}" (${brand}). يرجى التأكد من صحة الموديل.`
            );
            modelFound = true;
            break;
          }
        }
      }

      // If still no match, check if input contains "dodge" or "دودج"
      if (!modelFound) {
        const dodgeKeywords = ["dodge", "دودج", "dodg"];
        const hasDodge = words.some((word) =>
          dodgeKeywords.includes(word.toLowerCase())
        );

        if (hasDodge) {
          brand = "دودج";
          model = words
            .filter((word) => !dodgeKeywords.includes(word.toLowerCase()))
            .join(" ");
          if (model) {
            suggestions.push(
              "تم تحديد الماركة كدودج. يرجى التأكد من صحة الموديل."
            );
          }
        }
      }
    }
  } else if (words.length === 1) {
    // Single word input - check if it's a model
    const singleWord = words[0];
    if (CAR_BRANDS[singleWord]) {
      brand = CAR_BRANDS[singleWord];
      model = singleWord;
      suggestions.push(
        `تم افتراض أن ${singleWord} هي ${brand}. يرجى إضافة الماركة الكاملة للدقة.`
      );
    } else {
      // Try fuzzy matching for typos
      const modelOptions = Object.keys(CAR_BRANDS);
      const closestMatch = findClosestMatch(singleWord, modelOptions);

      if (closestMatch) {
        brand = CAR_BRANDS[closestMatch.match];
        model = closestMatch.match;
        suggestions.push(
          `تم تصحيح "${singleWord}" إلى "${closestMatch.match}" (${brand}). يرجى التأكد من صحة الموديل.`
        );
      } else {
        model = singleWord;
        suggestions.push("يرجى إضافة ماركة السيارة للتحليل الأفضل.");
        warnings.push(
          `الموديل "${singleWord}" غير معروف. يرجى التأكد من صحة الموديل.`
        );
      }
    }
  }

  // If no brand found, try to extract from carType field
  if (!brand && carTypeInput.trim()) {
    const carTypeWords = carTypeInput.toLowerCase().trim().split(/\s+/);
    for (const word of carTypeWords) {
      if (CAR_BRANDS[word]) {
        brand = CAR_BRANDS[word];
        break;
      }
    }
  }

  // If still no brand, check if carType contains brand information
  if (!brand && carTypeInput.trim()) {
    const carTypeLower = carTypeInput.toLowerCase();
    for (const [modelKey, brandName] of Object.entries(CAR_BRANDS)) {
      if (carTypeLower.includes(modelKey)) {
        brand = brandName;
        if (!model) {
          model = modelKey;
        }
        break;
      }
    }
  }

  // Validate year if present
  if (year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      warnings.push(`سنة ${year} غير صحيحة. يرجى التأكد من السنة.`);
      year = undefined;
    }
  }

  return {
    brand,
    model,
    year,
    isNew,
    suggestions,
    warnings,
  };
};

// Test cases
const testCases = [
  // Toyota tests
  {
    input: "تويوتا",
    model: "كامري 2019",
    description: "Toyota Camry with year",
  },
  { input: "كامري", model: "", description: "Camry only (auto-detect Toyota)" },
  { input: "camery", model: "", description: "Typo for Camry" },

  // Dodge tests
  {
    input: "دودج",
    model: "تشالنجر 2020",
    description: "Dodge Challenger with year",
  },
  {
    input: "تشالنجر",
    model: "",
    description: "Challenger only (auto-detect Dodge)",
  },
  { input: "challengr", model: "", description: "Typo for Challenger" },
  { input: "dodg", model: "charger", description: "Typo for Dodge + Charger" },
  { input: "دودج", model: "تشارجر", description: "Dodge Charger in Arabic" },

  // Edge cases
  { input: "unknown", model: "model", description: "Unknown brand and model" },
  { input: "كامري", model: "3000", description: "Invalid year" },
  {
    input: "كامري",
    model: "2025",
    description: "Future year (should be valid)",
  },
  { input: "", model: "", description: "Empty input" },

  // Multi-word tests
  {
    input: "تويوتا كامري",
    model: "2019",
    description: "Brand and model together",
  },
  {
    input: "دودج تشالنجر",
    model: "2020",
    description: "Dodge Challenger together",
  },
];

console.log("=== CAR VALIDATION SYSTEM TEST ===\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: "${testCase.input}" + "${testCase.model}"`);

  const result = parseCarInput(testCase.input, testCase.model);

  console.log(`Result:`);
  console.log(`  Brand: ${result.brand || "Not detected"}`);
  console.log(`  Model: ${result.model || "Not detected"}`);
  console.log(`  Year: ${result.year || "Not detected"}`);
  console.log(`  Is New: ${result.isNew}`);

  if (result.suggestions.length > 0) {
    console.log(`  Suggestions: ${result.suggestions.join(", ")}`);
  }

  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join(", ")}`);
  }

  console.log("---\n");
});

// Test mileage validation
console.log("=== MILEAGE VALIDATION TEST ===\n");

const mileageTests = [
  { input: "120000", expected: "Valid" },
  { input: "0", expected: "New car" },
  { input: "100km", expected: "Should be filtered to 100" },
  { input: "ten", expected: "Should be filtered to empty" },
  { input: "abc123def", expected: "Should be filtered to 123" },
];

mileageTests.forEach((test, index) => {
  const filtered = test.input.replace(/[^0-9]/g, "");
  const isValid =
    filtered !== "" && !isNaN(Number(filtered)) && Number(filtered) >= 0;
  const isNewCar = filtered === "0";

  console.log(`Test ${index + 1}: "${test.input}"`);
  console.log(`  Filtered: "${filtered}"`);
  console.log(`  Valid: ${isValid}`);
  console.log(`  New Car: ${isNewCar}`);
  console.log(`  Expected: ${test.expected}`);
  console.log("---");
});

console.log("\n=== TEST COMPLETED ===");
