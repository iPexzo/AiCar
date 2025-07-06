import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import {
  analyzeCarProblem,
  getFollowUpAnalysis,
  CarAnalysisPayload,
  FollowUpAnswer,
} from "../api/analyze";
import {
  validateYearWithAPI,
  fetchYearRange,
  YearRange,
  clearYearRangeCache,
} from "../api/carQuery";
import { IntelligentCarDiagnosis } from "../components/IntelligentCarDiagnosis";

// Modern Mobile App Color Palette (60-30-10 Rule)
const BG = "#121212"; // 60% - Primary charcoal dark background
const CARD = "#2D2D2D"; // 30% - Secondary medium gray for containers
const ACCENT = "#3B82F6"; // 10% - Electric blue accent
const TEXT = "#FFFFFF"; // Primary text color (white)
const SUBTEXT = "#A0A0A0"; // Secondary text color (light gray)
const BTN = "#3B82F6"; // Button color (electric blue)
const BTN_TEXT = "#FFFFFF"; // Button text (white)
const RESULT_BG = "#1F1F1F"; // Result background (darker gray)
const SUCCESS = "#10B981"; // Success color (green)
const ERROR = "#EF4444"; // Error color (soft red)
const WARNING = "#F59E0B"; // Warning color (amber)
const BORDER = "#404040"; // Border color (medium gray)
const SHADOW = "rgba(0, 0, 0, 0.4)"; // Enhanced shadow
const INPUT_BG = "#1F1F1F"; // Input background (darker gray)

// Car brand mapping for common models
const CAR_BRANDS: { [key: string]: string } = {
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

// Model-specific year validation database
interface ModelYearRange {
  startYear: number;
  endYear?: number; // undefined means still in production
  modelName: string;
  brandName: string;
}

const MODEL_YEAR_RANGES: { [key: string]: ModelYearRange } = {
  // Toyota models
  camry: { startYear: 1982, modelName: "Camry", brandName: "تويوتا" },
  corolla: { startYear: 1966, modelName: "Corolla", brandName: "تويوتا" },
  rav4: { startYear: 1994, modelName: "RAV4", brandName: "تويوتا" },
  highlander: { startYear: 2000, modelName: "Highlander", brandName: "تويوتا" },
  "land cruiser": {
    startYear: 1951,
    modelName: "Land Cruiser",
    brandName: "تويوتا",
  },
  prado: { startYear: 1990, modelName: "Prado", brandName: "تويوتا" },
  fortuner: { startYear: 2004, modelName: "Fortuner", brandName: "تويوتا" },
  hilux: { startYear: 1968, modelName: "Hilux", brandName: "تويوتا" },
  yaris: { startYear: 1999, modelName: "Yaris", brandName: "تويوتا" },
  avalon: { startYear: 1994, modelName: "Avalon", brandName: "تويوتا" },
  prius: { startYear: 1997, modelName: "Prius", brandName: "تويوتا" },

  // Honda models
  civic: { startYear: 1972, modelName: "Civic", brandName: "هوندا" },
  accord: { startYear: 1976, modelName: "Accord", brandName: "هوندا" },
  "cr-v": { startYear: 1995, modelName: "CR-V", brandName: "هوندا" },
  pilot: { startYear: 2002, modelName: "Pilot", brandName: "هوندا" },
  odyssey: { startYear: 1994, modelName: "Odyssey", brandName: "هوندا" },
  fit: { startYear: 2001, modelName: "Fit", brandName: "هوندا" },

  // Nissan models
  altima: { startYear: 1992, modelName: "Altima", brandName: "نيسان" },
  sentra: { startYear: 1982, modelName: "Sentra", brandName: "نيسان" },
  rogue: { startYear: 2007, modelName: "Rogue", brandName: "نيسان" },
  murano: { startYear: 2002, modelName: "Murano", brandName: "نيسان" },
  pathfinder: { startYear: 1986, modelName: "Pathfinder", brandName: "نيسان" },
  maxima: { startYear: 1981, modelName: "Maxima", brandName: "نيسان" },

  // Hyundai models
  elantra: { startYear: 1990, modelName: "Elantra", brandName: "هيونداي" },
  sonata: { startYear: 1985, modelName: "Sonata", brandName: "هيونداي" },
  tucson: { startYear: 2004, modelName: "Tucson", brandName: "هيونداي" },
  "santa fe": { startYear: 2000, modelName: "Santa Fe", brandName: "هيونداي" },
  accent: { startYear: 1994, modelName: "Accent", brandName: "هيونداي" },
  veloster: { startYear: 2011, modelName: "Veloster", brandName: "هيونداي" },

  // Kia models
  forte: { startYear: 2008, modelName: "Forte", brandName: "كيا" },
  optima: { startYear: 2000, modelName: "Optima", brandName: "كيا" },
  sportage: { startYear: 1993, modelName: "Sportage", brandName: "كيا" },
  sorento: { startYear: 2002, modelName: "Sorento", brandName: "كيا" },
  rio: { startYear: 1999, modelName: "Rio", brandName: "كيا" },
  soul: { startYear: 2008, modelName: "Soul", brandName: "كيا" },

  // Ford models
  focus: { startYear: 1998, modelName: "Focus", brandName: "فورد" },
  fusion: { startYear: 2005, modelName: "Fusion", brandName: "فورد" },
  escape: { startYear: 2000, modelName: "Escape", brandName: "فورد" },
  explorer: { startYear: 1990, modelName: "Explorer", brandName: "فورد" },
  "f-150": { startYear: 1975, modelName: "F-150", brandName: "فورد" },
  mustang: { startYear: 1964, modelName: "Mustang", brandName: "فورد" },

  // Chevrolet models
  cruze: { startYear: 2008, modelName: "Cruze", brandName: "شيفروليه" },
  malibu: { startYear: 1964, modelName: "Malibu", brandName: "شيفروليه" },
  equinox: { startYear: 2004, modelName: "Equinox", brandName: "شيفروليه" },
  tahoe: { startYear: 1994, modelName: "Tahoe", brandName: "شيفروليه" },
  silverado: { startYear: 1998, modelName: "Silverado", brandName: "شيفروليه" },
  camaro: { startYear: 1966, modelName: "Camaro", brandName: "شيفروليه" },

  // BMW models
  "3 series": {
    startYear: 1975,
    modelName: "3 Series",
    brandName: "بي إم دبليو",
  },
  "5 series": {
    startYear: 1972,
    modelName: "5 Series",
    brandName: "بي إم دبليو",
  },
  x3: { startYear: 2003, modelName: "X3", brandName: "بي إم دبليو" },
  x5: { startYear: 1999, modelName: "X5", brandName: "بي إم دبليو" },
  m3: { startYear: 1986, modelName: "M3", brandName: "بي إم دبليو" },
  m5: { startYear: 1984, modelName: "M5", brandName: "بي إم دبليو" },

  // Mercedes models
  "c-class": { startYear: 1993, modelName: "C-Class", brandName: "مرسيدس" },
  "e-class": { startYear: 1984, modelName: "E-Class", brandName: "مرسيدس" },
  "s-class": { startYear: 1972, modelName: "S-Class", brandName: "مرسيدس" },
  gla: { startYear: 2013, modelName: "GLA", brandName: "مرسيدس" },
  glc: { startYear: 2015, modelName: "GLC", brandName: "مرسيدس" },
  gle: { startYear: 1997, modelName: "GLE", brandName: "مرسيدس" },

  // Audi models
  a3: { startYear: 1996, modelName: "A3", brandName: "أودي" },
  a4: { startYear: 1994, modelName: "A4", brandName: "أودي" },
  a6: { startYear: 1994, modelName: "A6", brandName: "أودي" },
  q3: { startYear: 2011, modelName: "Q3", brandName: "أودي" },
  q5: { startYear: 2008, modelName: "Q5", brandName: "أودي" },
  q7: { startYear: 2005, modelName: "Q7", brandName: "أودي" },

  // Lexus models
  es: { startYear: 1989, modelName: "ES", brandName: "لكزس" },
  is: { startYear: 1998, modelName: "IS", brandName: "لكزس" },
  rx: { startYear: 1998, modelName: "RX", brandName: "لكزس" },
  nx: { startYear: 2014, modelName: "NX", brandName: "لكزس" },
  ls: { startYear: 1989, modelName: "LS", brandName: "لكزس" },
  gs: { startYear: 1993, modelName: "GS", brandName: "لكزس" },

  // Dodge models
  charger: { startYear: 2006, modelName: "Charger", brandName: "دودج" },
  challenger: { startYear: 1970, modelName: "Challenger", brandName: "دودج" },
  durango: { startYear: 1997, modelName: "Durango", brandName: "دودج" },
  journey: { startYear: 2008, modelName: "Journey", brandName: "دودج" },
  ram: { startYear: 1981, modelName: "Ram", brandName: "دودج" },
  dart: { startYear: 2012, modelName: "Dart", brandName: "دودج" },
  caliber: { startYear: 2006, modelName: "Caliber", brandName: "دودج" },
  nitro: { startYear: 2006, modelName: "Nitro", brandName: "دودج" },

  // Arabic variations for Dodge models
  تشالنجر: { startYear: 1970, modelName: "Challenger", brandName: "دودج" },
  تشارجر: { startYear: 2006, modelName: "Charger", brandName: "دودج" },
  دورانجو: { startYear: 1997, modelName: "Durango", brandName: "دودج" },
  جورني: { startYear: 2008, modelName: "Journey", brandName: "دودج" },
  دارت: { startYear: 2012, modelName: "Dart", brandName: "دودج" },
  كاليبر: { startYear: 2006, modelName: "Caliber", brandName: "دودج" },
  نايترو: { startYear: 2006, modelName: "Nitro", brandName: "دودج" },
};

// Helper function to validate year for a specific model
const validateModelYear = (
  model: string,
  year: number
): { isValid: boolean; message?: string } => {
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

// Helper function to get model year range info
const getModelYearRange = (model: string): ModelYearRange | null => {
  const modelKey = model.toLowerCase().trim();
  return MODEL_YEAR_RANGES[modelKey] || null;
};

// Interface for parsed car information
interface ParsedCarInfo {
  brand: string;
  model: string;
  year?: number;
  isNew: boolean;
  suggestions: string[];
  warnings: string[];
  yearValidation?: {
    isValid: boolean;
    message?: string;
    yearRange?: ModelYearRange;
  };
}

// Helper function for fuzzy string matching (Levenshtein distance)
const levenshteinDistance = (str1: string, str2: string): number => {
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
const findClosestMatch = (
  input: string,
  options: string[]
): { match: string; distance: number } | null => {
  let closestMatch: string | null = null;
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
const parseCarInput = (
  carTypeInput: string,
  carModelInput: string,
  carYearInput?: string
): ParsedCarInfo => {
  const suggestions: string[] = [];
  const warnings: string[] = [];

  let brand = "";
  let model = "";
  let year: number | undefined;
  let isNew = false;

  // Combine inputs for analysis
  const combinedInput = `${carTypeInput} ${carModelInput}`.trim().toLowerCase();

  // Extract year from separate year input first, then from combined input
  if (carYearInput && carYearInput.trim()) {
    year = parseInt(carYearInput.trim());
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear + 1) {
      warnings.push(`سنة ${year} غير صحيحة. يرجى التأكد من السنة.`);
      year = undefined;
    } else if (year === currentYear || year === currentYear + 1) {
      isNew = true;
    }
  } else {
    // Fallback: Extract year from combined input (look for 4-digit year)
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

  // Validate year if present with model-specific validation
  let yearValidation:
    | { isValid: boolean; message?: string; yearRange?: ModelYearRange }
    | undefined;

  if (year !== undefined) {
    const yearRange = getModelYearRange(model);
    const validation = validateModelYear(model, year);

    yearValidation = {
      isValid: validation.isValid,
      message: validation.message,
      yearRange: yearRange || undefined,
    };

    if (!validation.isValid) {
      warnings.push(
        validation.message || `سنة ${year} غير صحيحة. يرجى التأكد من السنة.`
      );
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
    yearValidation,
  };
};

// Test function for Dodge validation (for debugging)
const testDodgeValidation = () => {
  const testCases = [
    {
      input: "Dodge Challenger 2020",
      expected: { brand: "دودج", model: "challenger", year: 2020 },
    },
    {
      input: "Challenger 2020",
      expected: { brand: "دودج", model: "challenger", year: 2020 },
    },
    { input: "دودج تشالنجر", expected: { brand: "دودج", model: "تشالنجر" } },
    { input: "تشالنجر", expected: { brand: "دودج", model: "تشالنجر" } },
    {
      input: "dodg challengr",
      expected: { brand: "دودج", model: "challenger" },
    }, // Typo test
    { input: "charger", expected: { brand: "دودج", model: "charger" } },
    { input: "durango", expected: { brand: "دودج", model: "durango" } },
  ];

  console.log("=== Testing Dodge Validation ===");
  testCases.forEach((testCase, index) => {
    const result = parseCarInput(testCase.input, "", "");
    console.log(`Test ${index + 1}: "${testCase.input}"`);
    console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(
      `  Result: ${JSON.stringify({
        brand: result.brand,
        model: result.model,
        year: result.year,
      })}`
    );
    console.log(`  Suggestions: ${result.suggestions.join(", ")}`);
    console.log(`  Warnings: ${result.warnings.join(", ")}`);
    console.log("---");
  });
};

// Enhanced Zod validation schema
const carAnalysisSchema = z.object({
  carType: z.string().min(1, "نوع السيارة مطلوب"),
  carModel: z.string().min(1, "موديل السيارة مطلوب"),
  carYear: z
    .string()
    .min(1, "سنة السيارة مطلوبة")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1900,
      "سنة السيارة يجب أن تكون 1900 أو أحدث"
    ),
  mileage: z
    .string()
    .min(1, "الممشى مطلوب")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "الممشى يجب أن يكون رقم صحيح"
    ),
  problemDescription: z
    .string()
    .min(10, "وصف المشكلة يجب أن يكون 10 أحرف على الأقل"),
});

const HomeScreen = () => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const sectionAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Enhanced animation refs
  const smartButtonAnim = useRef(new Animated.Value(0)).current;
  const loadingDotsAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [carType, setCarType] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Enhanced validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showErrors, setShowErrors] = useState(false);
  const [parsedCarInfo, setParsedCarInfo] = useState<ParsedCarInfo | null>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  // API-based year validation state
  const [yearRange, setYearRange] = useState<YearRange | null>(null);
  const [isLoadingYearRange, setIsLoadingYearRange] = useState(false);
  const [yearValidationMessage, setYearValidationMessage] = useState("");

  // Analysis state
  const [currentStep, setCurrentStep] = useState<
    "form" | "initial-result" | "follow-up" | "final-result"
  >("form");
  const [initialAnalysis, setInitialAnalysis] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<any[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState("");
  const [analysisSections, setAnalysisSections] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Test Dodge validation on component mount (for debugging)
  useEffect(() => {
    if (__DEV__) {
      testDodgeValidation();
    }
  }, []);

  // Animation functions
  const animateIn = () => {
    // Reset to initial state first
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetAnimations = () => {
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    sectionAnimations.forEach((anim) => anim.setValue(0));
    smartButtonAnim.setValue(0);
    loadingDotsAnim.setValue(0);
  };

  // Enhanced animation functions
  const animateSmartButton = () => {
    Animated.timing(smartButtonAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const animateLoadingDots = () => {
    Animated.loop(
      Animated.timing(loadingDotsAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  };

  // React Query mutations
  const initialAnalysisMutation = useMutation({
    mutationFn: analyzeCarProblem,
    onSuccess: (data) => {
      console.log("[DEBUG] ===== MUTATION SUCCESS =====");
      console.log("[DEBUG] Initial analysis successful:", data);
      setInitialAnalysis(data.result);
      setFollowUpQuestions(data.followUpQuestions || []);
      setCurrentStep("initial-result");
      animateIn(); // Animate the initial result
      // Animate smart button after a delay
      setTimeout(() => {
        animateSmartButton();
      }, 1000);
      console.log("[DEBUG] State updated, moving to initial-result step");
    },
    onError: (error: any) => {
      console.error("[DEBUG] ===== MUTATION ERROR =====");
      console.error("[DEBUG] Initial analysis failed:", error);
      console.error("[DEBUG] Error details:", error);
      Alert.alert(
        "خطأ في التحليل",
        `حدث خطأ أثناء التحليل: ${error.message || "خطأ غير معروف"}`
      );
    },
    onMutate: (variables) => {
      console.log("[DEBUG] ===== MUTATION STARTED =====");
      console.log("[DEBUG] Mutation started with variables:", variables);
      // Start loading animation
      animateLoadingDots();
    },
  });

  const followUpAnalysisMutation = useMutation({
    mutationFn: getFollowUpAnalysis,
    onSuccess: (data) => {
      console.log("[DEBUG] Follow-up analysis successful:", data);
      setFinalAnalysis(data.result);
      const sections = parseAnalysisSections(data.result);
      setAnalysisSections(sections);
      setCurrentStep("final-result");
      animateIn(); // Animate the final result
      // Start section animations after a short delay
      setTimeout(() => {
        animateSections();
      }, 500);
    },
    onError: (error: any) => {
      console.error("[DEBUG] Follow-up analysis failed:", error);
      Alert.alert("خطأ", error.message || "حدث خطأ أثناء التحليل النهائي");
    },
  });

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(base64Image);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء اختيار الصورة");
    }
  };

  // Enhanced validation function
  const validateForm = () => {
    try {
      // Basic validation
      carAnalysisSchema.parse({
        carType: carType.trim(),
        carModel: carModel.trim(),
        carYear: carYear.trim(),
        mileage: mileage.trim(),
        problemDescription: problemDescription.trim(),
      });

      // Parse car information
      const parsed = parseCarInput(
        carType.trim(),
        carModel.trim(),
        carYear.trim()
      );
      setParsedCarInfo(parsed);

      // Model-specific year validation
      const newErrors: { [key: string]: string } = {};

      if (carYear.trim() && carModel.trim()) {
        const year = parseInt(carYear.trim());
        const validation = validateModelYear(carModel.trim(), year);

        if (!validation.isValid) {
          newErrors.carYear = validation.message || "سنة غير صحيحة";
        }
      }

      if (parsed.warnings.length > 0) {
        newErrors.carModel = parsed.warnings[0];
      }

      if (parsed.suggestions.length > 0) {
        setShowSuggestions(true);
      }

      setValidationErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(newErrors);
      }
      return false;
    }
  };

  // Enhanced input change handlers
  const handleCarTypeChange = (text: string) => {
    setCarType(text);
    setShowErrors(false);
    setShowSuggestions(false);
    setValidationErrors({});

    // Real-time validation for car info
    if (text.trim() || carModel.trim()) {
      const parsed = parseCarInput(
        text.trim(),
        carModel.trim(),
        carYear.trim()
      );
      setParsedCarInfo(parsed);
      if (parsed.suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }

    // Fetch year range when both brand and model are available
    if (text.trim() && carModel.trim()) {
      fetchYearRangeForModel(text.trim(), carModel.trim());
    }
  };

  // Function to fetch year range when brand and model are selected
  const fetchYearRangeForModel = async (brand: string, model: string) => {
    if (!brand.trim() || !model.trim()) return;

    setIsLoadingYearRange(true);
    try {
      const yearRange = await fetchYearRange(brand.trim(), model.trim());
      setYearRange(yearRange);

      // Show info message if using fallback validation
      if (!yearRange.isValid && yearRange.message) {
        setYearValidationMessage(yearRange.message);
      } else {
        setYearValidationMessage("");
      }
    } catch (error) {
      console.error("[CarQuery] Error fetching year range:", error);
      setYearRange(null);
      setYearValidationMessage("");
    } finally {
      setIsLoadingYearRange(false);
    }
  };

  const handleCarModelChange = (text: string) => {
    setCarModel(text);
    setShowErrors(false);
    setShowSuggestions(false);
    setValidationErrors({});

    // Real-time validation for car info
    if (text.trim() || carType.trim()) {
      const parsed = parseCarInput(carType.trim(), text.trim(), carYear.trim());
      setParsedCarInfo(parsed);
      if (parsed.suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }

    // Fetch year range when both brand and model are available
    if (text.trim() && carType.trim()) {
      fetchYearRangeForModel(carType.trim(), text.trim());
    }
  };

  const handleMileageChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    setMileage(numericValue);
    setShowErrors(false);
    setValidationErrors({});
  };

  const handleCarYearChange = async (text: string) => {
    // Only allow numbers and limit to 4 digits
    const numericValue = text.replace(/[^0-9]/g, "").slice(0, 4);
    setCarYear(numericValue);
    setShowErrors(false);
    setValidationErrors({});
    setYearValidationMessage("");

    // Real-time API-based year validation if we have both brand and model
    if (numericValue && carType.trim() && carModel.trim()) {
      const year = parseInt(numericValue);
      setIsLoadingYearRange(true);

      try {
        const validation = await validateYearWithAPI(
          carType.trim(),
          carModel.trim(),
          year
        );

        if (validation.yearRange) {
          setYearRange(validation.yearRange);
        }

        if (!validation.isValid) {
          setYearValidationMessage(validation.message || "سنة غير صحيحة");
          setValidationErrors((prev) => ({
            ...prev,
            carYear: validation.message || "سنة غير صحيحة",
          }));
        } else {
          setYearValidationMessage("");
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.carYear;
            return newErrors;
          });
        }
      } catch (error) {
        console.error("[CarQuery] Error in year validation:", error);
        // Fallback to static validation
        const staticValidation = validateModelYear(carModel.trim(), year);
        if (!staticValidation.isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            carYear: staticValidation.message || "سنة غير صحيحة",
          }));
        }
      } finally {
        setIsLoadingYearRange(false);
      }
    }
  };

  // Enhanced analyze function
  const handleInitialAnalyze = () => {
    setShowErrors(true);

    if (!validateForm()) {
      return;
    }

    if (!parsedCarInfo) {
      Alert.alert("خطأ", "يرجى إدخال معلومات السيارة بشكل صحيح");
      return;
    }

    // Prepare the payload with parsed information
    const payload: CarAnalysisPayload = {
      carType: parsedCarInfo.brand || carType.trim(),
      carModel: parsedCarInfo.model || carModel.trim(),
      mileage: mileage.trim(),
      problemDescription: problemDescription.trim(),
      image: selectedImage || undefined,
    };

    // Add year information if available
    if (parsedCarInfo.year) {
      payload.carModel = `${payload.carModel} ${parsedCarInfo.year}`;
    }

    // Add new car indicator
    if (parsedCarInfo.isNew) {
      payload.lastServiceType = "سيارة جديدة";
    }

    console.log("[DEBUG] Sending payload:", payload);
    initialAnalysisMutation.mutate(payload);
  };

  // Handle follow-up question answer
  const handleFollowUpAnswer = (questionId: string, answer: string) => {
    const existingAnswerIndex = followUpAnswers.findIndex(
      (a) => a.questionId === questionId
    );

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...followUpAnswers];
      newAnswers[existingAnswerIndex] = { questionId, answer };
      setFollowUpAnswers(newAnswers);
    } else {
      setFollowUpAnswers([...followUpAnswers, { questionId, answer }]);
    }
  };

  // Handle final analysis
  const handleFinalAnalyze = () => {
    if (followUpAnswers.length < followUpQuestions.length) {
      Alert.alert("خطأ", "يرجى الإجابة على جميع الأسئلة");
      return;
    }

    const request = {
      initialAnalysis,
      followUpAnswers,
      carDetails: {
        carType: carType.trim(),
        carModel: carModel.trim(),
        mileage: mileage.trim(),
        problemDescription: problemDescription.trim(),
      },
      image: selectedImage || undefined,
    };

    followUpAnalysisMutation.mutate(request);
  };

  // Reset to form
  const resetToForm = () => {
    resetAnimations();
    setCurrentStep("form");
    setInitialAnalysis("");
    setFollowUpQuestions([]);
    setFollowUpAnswers([]);
    setFinalAnalysis("");
    setAnalysisSections([]);
    setExpandedSections({});
    setValidationErrors({});
    setShowErrors(false);
    setSelectedImage(null);
    setCarType("");
    setCarModel("");
    setCarYear("");
    setMileage("");
    setProblemDescription("");

    // Clear API-based validation state
    setYearRange(null);
    setIsLoadingYearRange(false);
    setYearValidationMessage("");
    clearYearRangeCache();
  };

  // Handle smart questions transition
  const handleSmartQuestionsTransition = () => {
    setCurrentStep("follow-up");
  };

  // Professional input component with validation
  const ProfessionalInput = ({
    placeholder,
    value,
    onChangeText,
    error,
    multiline = false,
    keyboardType = "default",
    numberOfLines = 1,
  }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    multiline?: boolean;
    keyboardType?: "default" | "numeric";
    numberOfLines?: number;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={SUBTEXT}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        style={{
          backgroundColor: CARD,
          borderRadius: 12,
          padding: 16,
          color: TEXT,
          fontSize: 16,
          borderWidth: 2,
          borderColor: error ? ERROR : BORDER,
          minHeight: multiline ? 120 : 56,
          textAlignVertical: multiline ? "top" : "center",
          shadowColor: SHADOW,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          textAlign: "right",
        }}
      />
      {error && (
        <Animated.View
          style={{
            marginTop: 8,
            opacity: showErrors ? 1 : 0,
          }}
        >
          <Text
            style={{
              color: ERROR,
              fontSize: 14,
              marginLeft: 4,
            }}
          >
            {error}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  // Beautiful loading component
  const LoadingAnimation = () => (
    <View style={{ alignItems: "center", padding: 40 }}>
      <View
        style={{
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: ACCENT,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24, color: BTN_TEXT }}>●</Text>
        </View>
      </View>

      <Text
        style={{
          color: TEXT,
          fontSize: 16,
          fontWeight: "500",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        الذكاء الاصطناعي يحلل مشكلتك...
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[0, 1, 2].map((dotIndex) => (
          <Animated.View
            key={`loading-dot-${dotIndex}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: ACCENT,
              marginHorizontal: 4,
              opacity: loadingDotsAnim.interpolate({
                inputRange: [0, 0.33, 0.66, 1],
                outputRange: [0.4, 1, 0.4, 0.4],
                extrapolate: "clamp",
              }),
            }}
          />
        ))}
      </View>
    </View>
  );

  // Animate sections gradually with smooth fade-in
  const animateSections = () => {
    sectionAnimations.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 300), // 300ms delay between each section
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Parse analysis into sections
  const parseAnalysisSections = (analysis: string) => {
    const sections = [];

    // Split by common section indicators
    const lines = analysis.split("\n").filter((line) => line.trim());

    let currentSection = {
      type: "diagnosis",
      content: "",
      title: "التشخيص",
      icon: "●",
    };
    let currentContent = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect section headers
      if (
        trimmedLine.includes("التشخيص") ||
        trimmedLine.includes("المشكلة") ||
        trimmedLine.includes("السبب")
      ) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n");
          sections.push({ ...currentSection });
        }
        currentSection = {
          type: "diagnosis",
          content: "",
          title: "التشخيص",
          icon: "●",
        };
        currentContent = [];
      } else if (
        trimmedLine.includes("التوصيات") ||
        trimmedLine.includes("الحلول") ||
        trimmedLine.includes("الإجراءات")
      ) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n");
          sections.push({ ...currentSection });
        }
        currentSection = {
          type: "recommendations",
          content: "",
          title: "التوصيات",
          icon: "●",
        };
        currentContent = [];
      } else if (
        trimmedLine.includes("التكلفة") ||
        trimmedLine.includes("السعر") ||
        trimmedLine.includes("التكلفة المتوقعة")
      ) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n");
          sections.push({ ...currentSection });
        }
        currentSection = {
          type: "costs",
          content: "",
          title: "التكلفة المتوقعة",
          icon: "●",
        };
        currentContent = [];
      } else if (
        trimmedLine.includes("السلامة") ||
        trimmedLine.includes("النصائح") ||
        trimmedLine.includes("التحذيرات")
      ) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n");
          sections.push({ ...currentSection });
        }
        currentSection = {
          type: "safety",
          content: "",
          title: "نصائح السلامة",
          icon: "●",
        };
        currentContent = [];
      } else {
        currentContent.push(trimmedLine);
      }
    }

    // Add the last section
    if (currentContent.length > 0) {
      currentSection.content = currentContent.join("\n");
      sections.push({ ...currentSection });
    }

    // If no sections were detected, create a default structure
    if (sections.length === 0) {
      sections.push({
        type: "diagnosis",
        content: analysis,
        title: "التشخيص",
        icon: "●",
      });
    }

    return sections;
  };

  // Toggle section expansion
  const toggleSectionExpansion = (sectionType: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionType]: !prev[sectionType],
    }));
  };

  // Render form step
  const renderForm = () => (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 24,
        shadowColor: SHADOW,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
        marginTop: 16,
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 24,
          fontWeight: "600",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        تحليل مشاكل السيارة
      </Text>

      {/* Smart Suggestions Banner */}
      {showSuggestions &&
        parsedCarInfo &&
        parsedCarInfo.suggestions.length > 0 && (
          <View
            style={{
              backgroundColor: `${WARNING}20`,
              borderWidth: 1,
              borderColor: WARNING,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: WARNING,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              💡 اقتراحات لتحسين التحليل
            </Text>
            {parsedCarInfo.suggestions.map((suggestion, index) => (
              <Text
                key={index}
                style={{
                  color: WARNING,
                  fontSize: 12,
                  marginBottom: 4,
                  lineHeight: 18,
                }}
              >
                • {suggestion}
              </Text>
            ))}
          </View>
        )}

      {/* Parsed Car Info Display */}
      {parsedCarInfo && parsedCarInfo.brand && (
        <View
          style={{
            backgroundColor: `${SUCCESS}20`,
            borderWidth: 1,
            borderColor: SUCCESS,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: SUCCESS,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            ✅ تم تحليل معلومات السيارة
          </Text>
          <Text
            style={{
              color: TEXT,
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            الماركة: {parsedCarInfo.brand}
          </Text>
          <Text
            style={{
              color: TEXT,
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            الموديل: {parsedCarInfo.model}
          </Text>
          {parsedCarInfo.year && (
            <Text
              style={{
                color: TEXT,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              السنة: {parsedCarInfo.year}
            </Text>
          )}
          {parsedCarInfo.yearValidation &&
            !parsedCarInfo.yearValidation.isValid && (
              <Text
                style={{
                  color: ERROR,
                  fontSize: 12,
                  marginBottom: 4,
                  fontWeight: "600",
                }}
              >
                ⚠️ {parsedCarInfo.yearValidation.message}
              </Text>
            )}
          {parsedCarInfo.isNew && (
            <Text
              style={{
                color: SUCCESS,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              🆕 سيارة جديدة
            </Text>
          )}
        </View>
      )}

      {/* Car Details Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: TEXT,
            marginBottom: 16,
          }}
        >
          تفاصيل السيارة
        </Text>

        <View style={{ gap: 16 }}>
          {/* Car Type */}
          <View>
            <Text
              style={{
                color: TEXT,
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              نوع السيارة
            </Text>
            <TextInput
              placeholder="مثال: تويوتا كامري، دودج تشالنجر، أو كامري فقط"
              placeholderTextColor={SUBTEXT}
              value={carType}
              onChangeText={handleCarTypeChange}
              style={{
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                padding: 16,
                color: TEXT,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.carType ? ERROR : BORDER,
                minHeight: 48,
                textAlign: "right",
              }}
            />
            {validationErrors.carType && showErrors && (
              <Text
                style={{
                  color: ERROR,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                {validationErrors.carType}
              </Text>
            )}
          </View>

          {/* Car Model */}
          <View>
            <Text
              style={{
                color: TEXT,
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              موديل السيارة
            </Text>
            <TextInput
              placeholder="مثال: كامري، تشالنجر، أو كامري فقط"
              placeholderTextColor={SUBTEXT}
              value={carModel}
              onChangeText={handleCarModelChange}
              style={{
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                padding: 16,
                color: TEXT,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.carModel ? ERROR : BORDER,
                minHeight: 48,
                textAlign: "right",
              }}
            />
            {validationErrors.carModel && showErrors && (
              <Text
                style={{
                  color: ERROR,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                {validationErrors.carModel}
              </Text>
            )}
          </View>

          {/* Car Year */}
          <View>
            <Text
              style={{
                color: TEXT,
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              سنة السيارة
            </Text>
            <TextInput
              placeholder="مثال: 2019، 2020، 2021"
              placeholderTextColor={SUBTEXT}
              value={carYear}
              onChangeText={handleCarYearChange}
              keyboardType="numeric"
              style={{
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                padding: 16,
                color: TEXT,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.carYear ? ERROR : BORDER,
                minHeight: 48,
                textAlign: "right",
              }}
            />
            {validationErrors.carYear && showErrors && (
              <Text
                style={{
                  color: ERROR,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                {validationErrors.carYear}
              </Text>
            )}
            {/* Show API-based year range info if available */}
            {yearRange && !validationErrors.carYear && (
              <View style={{ marginTop: 6 }}>
                <Text
                  style={{
                    color: SUCCESS,
                    fontSize: 12,
                    marginRight: 4,
                    fontWeight: "400",
                  }}
                >
                  ✅ {yearRange.modelName} متوفر من {yearRange.minYear} إلى{" "}
                  {yearRange.maxYear}
                </Text>
                {yearRange.message && (
                  <Text
                    style={{
                      color: WARNING,
                      fontSize: 11,
                      marginRight: 4,
                      marginTop: 2,
                      fontWeight: "400",
                    }}
                  >
                    ℹ️ {yearRange.message}
                  </Text>
                )}
              </View>
            )}

            {/* Show loading indicator */}
            {isLoadingYearRange && (
              <View
                style={{
                  marginTop: 6,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: SUBTEXT,
                    fontSize: 12,
                    marginRight: 4,
                    fontWeight: "400",
                  }}
                >
                  🔄 جاري التحقق من سنوات الإنتاج...
                </Text>
              </View>
            )}

            {/* Show validation message */}
            {yearValidationMessage && !validationErrors.carYear && (
              <Text
                style={{
                  color: WARNING,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                ℹ️ {yearValidationMessage}
              </Text>
            )}
          </View>

          {/* Mileage */}
          <View>
            <Text
              style={{
                color: TEXT,
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              الممشى بالكيلومتر
            </Text>
            <TextInput
              placeholder="مثال: 120000 (0 للسيارات الجديدة)"
              placeholderTextColor={SUBTEXT}
              value={mileage}
              onChangeText={handleMileageChange}
              keyboardType="numeric"
              style={{
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                padding: 16,
                color: TEXT,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.mileage ? ERROR : BORDER,
                minHeight: 48,
                textAlign: "right",
              }}
            />
            {validationErrors.mileage && showErrors && (
              <Text
                style={{
                  color: ERROR,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                {validationErrors.mileage}
              </Text>
            )}
            {mileage === "0" && (
              <Text
                style={{
                  color: SUCCESS,
                  fontSize: 12,
                  marginTop: 6,
                  marginRight: 4,
                  fontWeight: "400",
                }}
              >
                ✅ تم تحديد السيارة كسيارة جديدة
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Problem Description Container */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: TEXT,
            marginBottom: 16,
          }}
        >
          اشرح العطلة بالتفصيل
        </Text>

        <View style={{ position: "relative" }}>
          <TextInput
            placeholder="اكتب وصفاً مفصلاً للمشكلة التي تواجهها مع السيارة..."
            placeholderTextColor={SUBTEXT}
            value={problemDescription}
            onChangeText={setProblemDescription}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: INPUT_BG,
              borderRadius: 16,
              padding: 16,
              color: TEXT,
              fontSize: 16,
              borderWidth: 1,
              borderColor: validationErrors.problemDescription ? ERROR : BORDER,
              minHeight: 140,
              textAlign: "right",
              textAlignVertical: "top",
              paddingBottom: 16,
            }}
          />

          {/* Analyze Button - Larger and Better Positioned */}
          <TouchableOpacity
            onPress={handleInitialAnalyze}
            disabled={initialAnalysisMutation.isPending}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: initialAnalysisMutation.isPending
                ? SUBTEXT
                : ACCENT,
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 24,
              minWidth: 160,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {initialAnalysisMutation.isPending ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator
                  color={BTN_TEXT}
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: BTN_TEXT,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  جاري التحليل...
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  color: BTN_TEXT,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                تحليل المشكلة
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {validationErrors.problemDescription && showErrors && (
          <Text
            style={{
              color: ERROR,
              fontSize: 12,
              marginTop: 6,
              marginRight: 4,
              fontWeight: "400",
            }}
          >
            {validationErrors.problemDescription}
          </Text>
        )}
      </View>

      {/* Camera Button Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: TEXT,
            marginBottom: 12,
          }}
        >
          إضافة صورة (اختياري)
        </Text>
        <TouchableOpacity
          onPress={pickImage}
          style={{
            backgroundColor: selectedImage ? SUCCESS + "20" : RESULT_BG,
            borderRadius: 12,
            padding: 20,
            borderWidth: 2,
            borderColor: selectedImage ? SUCCESS : BORDER,
            borderStyle: selectedImage ? "solid" : "dashed",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 12,
            shadowColor: SHADOW,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{ fontSize: 24, color: selectedImage ? SUCCESS : SUBTEXT }}
          >
            📷
          </Text>
          <Text
            style={{
              color: selectedImage ? SUCCESS : SUBTEXT,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {selectedImage ? "تم اختيار صورة" : "اضغط لإضافة صورة للمشكلة"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {selectedImage && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: RESULT_BG,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: SUCCESS, fontSize: 13, fontWeight: "600" }}>
              تم اختيار الصورة
            </Text>
            <Text style={{ color: SUBTEXT, fontSize: 11, marginTop: 1 }}>
              اضغط على زر الكاميرا أعلاه لتغيير الصورة
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={{
              padding: 6,
            }}
          >
            <Text style={{ fontSize: 16, color: SUBTEXT }}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render initial result step
  const renderInitialResult = () => (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: SHADOW,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 12,
        }}
      >
        نتيجة التحليل الأولي
      </Text>
      <Text
        style={{
          color: TEXT,
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 20,
        }}
      >
        {initialAnalysis}
      </Text>

      <Animated.View
        style={{
          opacity: smartButtonAnim,
        }}
      >
        <TouchableOpacity
          onPress={handleSmartQuestionsTransition}
          style={{
            backgroundColor: ACCENT,
            borderRadius: 12,
            padding: 18,
            alignItems: "center",
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ color: BTN_TEXT, fontSize: 16, fontWeight: "600" }}>
            تحليل أذكى؟ اضغط للحصول على أسئلة تفصيلية!
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // Render follow-up questions step
  const renderFollowUpQuestions = () => (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 24,
        shadowColor: SHADOW,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 16,
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        أسئلة ذكية لتحليل أدق للمشكلة
      </Text>

      {followUpQuestions.map((question, index) => (
        <View
          key={question.id}
          style={{
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: ACCENT,
              borderRadius: 18,
              padding: 16,
              marginLeft: 20,
              shadowColor: ACCENT,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: BTN_TEXT,
                fontSize: 16,
                fontWeight: "500",
                marginBottom: 12,
                textAlign: "right",
              }}
            >
              {index + 1}. {question.question}
            </Text>

            {question.type === "multiple_choice" && question.options ? (
              <View>
                {question.options.map((option: string, optionIndex: number) => {
                  const isSelected =
                    followUpAnswers.find((a) => a.questionId === question.id)
                      ?.answer === option;

                  return (
                    <TouchableOpacity
                      key={`${question.id}-${optionIndex}`}
                      onPress={() => handleFollowUpAnswer(question.id, option)}
                      style={{
                        backgroundColor: isSelected ? ACCENT : BG,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: isSelected ? ACCENT : SUBTEXT,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? BTN_TEXT : TEXT,
                          fontSize: 14,
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TextInput
                placeholder="اكتب إجابتك هنا..."
                placeholderTextColor={SUBTEXT}
                value={
                  followUpAnswers.find((a) => a.questionId === question.id)
                    ?.answer || ""
                }
                onChangeText={(text) => handleFollowUpAnswer(question.id, text)}
                multiline
                style={{
                  backgroundColor: BG,
                  borderRadius: 8,
                  padding: 12,
                  color: TEXT,
                  fontSize: 14,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
              />
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleFinalAnalyze}
        disabled={
          followUpAnalysisMutation.isPending ||
          followUpAnswers.length < followUpQuestions.length
        }
        style={{
          backgroundColor:
            followUpAnswers.length < followUpQuestions.length
              ? SUBTEXT
              : ACCENT,
          borderRadius: 18,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
          minWidth: 160,
          height: 48,
          alignSelf: "center",
        }}
      >
        {followUpAnalysisMutation.isPending ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator
              color={BTN_TEXT}
              size="small"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: BTN_TEXT,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              جاري التحليل النهائي...
            </Text>
          </View>
        ) : (
          <Text
            style={{
              color: BTN_TEXT,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            تم
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render final result step
  const renderFinalResult = () => (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 24,
        shadowColor: SHADOW,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        التحليل النهائي
      </Text>

      {analysisSections.map((section, index) => (
        <Animated.View
          key={`${section.type}-${index}`}
          style={{
            marginBottom: 16,
            opacity: sectionAnimations[index],
          }}
        >
          <View
            style={{
              backgroundColor: RESULT_BG,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: ACCENT,
              shadowColor: SHADOW,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {/* Section Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 8, color: ACCENT }}>
                {section.icon}
              </Text>
              <Text
                style={{
                  color: TEXT,
                  fontSize: 16,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {section.title}
              </Text>
            </View>

            {/* Section Content */}
            <View>
              {(() => {
                const contentLines = section.content
                  .split("\n")
                  .filter((line: string) => line.trim());
                const isExpanded = expandedSections[section.type];
                const displayLines = isExpanded
                  ? contentLines
                  : contentLines.slice(0, 2);
                const hasMore = contentLines.length > 2;

                return (
                  <>
                    {displayLines.map((line: string, lineIndex: number) => (
                      <Text
                        key={`${section.type}-${index}-line-${lineIndex}`}
                        style={{
                          color: TEXT,
                          fontSize: 14,
                          lineHeight: 20,
                          marginBottom: 8,
                          textAlign: "right",
                        }}
                      >
                        {line.trim()}
                      </Text>
                    ))}
                    {hasMore && (
                      <TouchableOpacity
                        onPress={() => toggleSectionExpansion(section.type)}
                        style={{
                          marginTop: 8,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: BG,
                          borderRadius: 6,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text
                          style={{
                            color: ACCENT,
                            fontSize: 12,
                            fontWeight: "500",
                          }}
                        >
                          {isExpanded ? "عرض أقل" : "عرض المزيد"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </View>
          </View>
        </Animated.View>
      ))}

      <TouchableOpacity
        onPress={resetToForm}
        style={{
          backgroundColor: ACCENT,
          borderRadius: 18,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 32,
          marginBottom: 16,
          width: 160,
          height: 48,
          alignSelf: "center",
        }}
      >
        <Text
          style={{
            color: BTN_TEXT,
            fontSize: 16,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          تحليل مشكلة جديدة
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: 60,
        paddingBottom: 60,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      bounces={true}
    >
      <View
        style={{
          maxWidth: 600,
          alignSelf: "center",
          width: "100%",
          minHeight: "100%",
        }}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <Text
            style={{
              color: TEXT,
              fontSize: 32,
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Car AI
          </Text>
          <Text
            style={{
              color: SUBTEXT,
              fontSize: 16,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            مساعدك الذكي لتشخيص مشاكل السيارات
          </Text>
        </Animated.View>

        {/* Render current step */}
        {currentStep === "form" && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            <IntelligentCarDiagnosis
              onAnalysisComplete={(result) => {
                console.log("[DEBUG] Analysis completed:", result);
                setInitialAnalysis(result.result);
                setFollowUpQuestions(result.followUpQuestions || []);
                setCurrentStep("initial-result");
                animateIn();
                setTimeout(() => {
                  animateSmartButton();
                }, 1000);
              }}
            />
          </Animated.View>
        )}
        {currentStep === "initial-result" && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            {renderInitialResult()}
          </Animated.View>
        )}
        {currentStep === "follow-up" && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            {renderFollowUpQuestions()}
          </Animated.View>
        )}
        {currentStep === "final-result" && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            {renderFinalResult()}
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
