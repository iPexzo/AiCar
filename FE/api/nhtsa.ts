import axios from "axios";
import carBrands from "../data/car-brands.json";

// NHTSA API configuration
const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api";

// Interfaces for NHTSA API responses
export interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
  Mfr_Name: string;
  Country: string;
  VehicleTypeName: string;
}

export interface NHTSAModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export interface NHTSAModelYear {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
  Model_Year: number;
}

export interface NHTSAResponse<T> {
  Count: number;
  Message: string;
  Results: T[];
}

// Brand name mapping for Arabic to English
const BRAND_MAPPING: { [key: string]: string } = {
  // Toyota
  تويوتا: "Toyota",
  toyota: "Toyota",
  Toyota: "Toyota",

  // Honda
  هوندا: "Honda",
  honda: "Honda",
  Honda: "Honda",

  // Nissan
  نيسان: "Nissan",
  nissan: "Nissan",
  Nissan: "Nissan",

  // Hyundai
  هيونداي: "Hyundai",
  hyundai: "Hyundai",
  Hyundai: "Hyundai",

  // Kia
  كيا: "Kia",
  kia: "Kia",
  Kia: "Kia",

  // Ford
  فورد: "Ford",
  ford: "Ford",
  Ford: "Ford",

  // Chevrolet
  شيفروليه: "Chevrolet",
  chevrolet: "Chevrolet",
  Chevrolet: "Chevrolet",

  // BMW
  "بي إم دبليو": "BMW",
  "بي ام دبليو": "BMW",
  bmw: "BMW",
  BMW: "BMW",

  // Mercedes
  مرسيدس: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  "Mercedes-Benz": "Mercedes-Benz",

  // Audi
  أودي: "Audi",
  audi: "Audi",
  Audi: "Audi",

  // Lexus
  لكزس: "Lexus",
  lexus: "Lexus",
  Lexus: "Lexus",

  // Dodge
  دودج: "Dodge",
  dodge: "Dodge",
  Dodge: "Dodge",

  // Volkswagen
  فولكسفاجن: "Volkswagen",
  volkswagen: "Volkswagen",
  Volkswagen: "Volkswagen",

  // Mazda
  مازدا: "Mazda",
  mazda: "Mazda",
  Mazda: "Mazda",

  // Subaru
  سوبارو: "Subaru",
  subaru: "Subaru",
  Subaru: "Subaru",

  // Mitsubishi
  ميتسوبيشي: "Mitsubishi",
  mitsubishi: "Mitsubishi",
  Mitsubishi: "Mitsubishi",

  // Jeep
  جيب: "Jeep",
  jeep: "Jeep",
  Jeep: "Jeep",

  // Chrysler
  كرايسلر: "Chrysler",
  chrysler: "Chrysler",
  Chrysler: "Chrysler",

  // Cadillac
  كاديلاك: "Cadillac",
  cadillac: "Cadillac",
  Cadillac: "Cadillac",

  // Buick
  بويك: "Buick",
  buick: "Buick",
  Buick: "Buick",

  // GMC
  "جي إم سي": "GMC",
  "جي ام سي": "GMC",
  gmc: "GMC",
  GMC: "GMC",

  // Lincoln
  لنكولن: "Lincoln",
  lincoln: "Lincoln",
  Lincoln: "Lincoln",

  // Acura
  أكورا: "Acura",
  acura: "Acura",
  Acura: "Acura",

  // Infiniti
  إنفينيتي: "Infiniti",
  infiniti: "Infiniti",
  Infiniti: "Infiniti",

  // Volvo
  فولفو: "Volvo",
  volvo: "Volvo",
  Volvo: "Volvo",

  // Land Rover
  "لاند روفر": "Land Rover",
  "land rover": "Land Rover",
  "Land Rover": "Land Rover",

  // Jaguar
  جاكوار: "Jaguar",
  jaguar: "Jaguar",
  Jaguar: "Jaguar",

  // Mini
  ميني: "MINI",
  mini: "MINI",
  MINI: "MINI",

  // Porsche
  بورش: "Porsche",
  porsche: "Porsche",
  Porsche: "Porsche",

  // Ferrari
  فيراري: "Ferrari",
  ferrari: "Ferrari",
  Ferrari: "Ferrari",

  // Lamborghini
  لامبورغيني: "Lamborghini",
  lamborghini: "Lamborghini",
  Lamborghini: "Lamborghini",

  // Maserati
  مازيراتي: "Maserati",
  maserati: "Maserati",
  Maserati: "Maserati",

  // Alfa Romeo
  "ألفا روميو": "Alfa Romeo",
  "alfa romeo": "Alfa Romeo",
  "Alfa Romeo": "Alfa Romeo",

  // Fiat
  فيات: "Fiat",
  fiat: "Fiat",
  Fiat: "Fiat",

  // Renault
  رينو: "Renault",
  renault: "Renault",
  Renault: "Renault",

  // Peugeot
  بيجو: "Peugeot",
  peugeot: "Peugeot",
  Peugeot: "Peugeot",

  // Citroen
  ستروين: "Citroen",
  citroen: "Citroen",
  Citroen: "Citroen",
};

// Helper function to normalize brand names
export const normalizeBrandName = (brand: string): string => {
  const normalized = brand.trim().toLowerCase();
  return BRAND_MAPPING[normalized] || brand;
};

// Helper function to find closest brand match
export const findClosestBrand = (
  input: string,
  brands: NHTSAMake[]
): NHTSAMake | null => {
  if (!input.trim()) return null;

  const normalizedInput = input.toLowerCase();

  // First try exact match
  const exactMatch = brands.find(
    (brand) => brand.Make_Name.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;

  // Then try starts with
  const startsWithMatch = brands.find((brand) =>
    brand.Make_Name.toLowerCase().startsWith(normalizedInput)
  );
  if (startsWithMatch) return startsWithMatch;

  // Finally try contains
  const containsMatch = brands.find((brand) =>
    brand.Make_Name.toLowerCase().includes(normalizedInput)
  );
  if (containsMatch) return containsMatch;

  return null;
};

// Helper: filter a brand name for validity
function isValidBrandName(brand: string): boolean {
  // Only allow brands in curated list (case-insensitive)
  const normalized = brand.trim().toLowerCase();
  const inCurated = carBrands.some((b) => b.toLowerCase() === normalized);
  if (!inCurated) return false;
  // No symbols or numbers (allow hyphens)
  if (/[^a-zA-Z\s\-]/.test(brand)) return false;
  if (/[0-9]/.test(brand)) return false;
  // No more than 3 words
  if (brand.trim().split(/\s+/).length > 3) return false;
  return true;
}

// 1. Get all car brands
export const getAllCarBrands = async (): Promise<NHTSAMake[]> => {
  try {
    console.log("[NHTSA] Fetching all car brands...");
    const response = await axios.get<NHTSAResponse<NHTSAMake>>(
      `${NHTSA_BASE_URL}/vehicles/getallmakes?format=json`
    );
    // Filter using curated list and rules
    const filtered = response.data.Results.filter((brand) =>
      isValidBrandName(brand.Make_Name)
    );
    console.log("[NHTSA] Brands fetched and filtered:", filtered.length);
    return filtered;
  } catch (error) {
    console.error("[NHTSA] Error fetching car brands:", error);
    throw new Error("فشل في جلب أنواع السيارات. يرجى المحاولة مرة أخرى.");
  }
};

// 2. Get models for a specific brand
export const getModelsForBrand = async (
  brand: string
): Promise<NHTSAModel[]> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    console.log("[NHTSA] Fetching models for brand:", normalizedBrand);

    const response = await axios.get<NHTSAResponse<NHTSAModel>>(
      `${NHTSA_BASE_URL}/vehicles/getmodelsformake/${encodeURIComponent(
        normalizedBrand
      )}?format=json`
    );

    console.log("[NHTSA] Models fetched successfully:", response.data.Count);
    return response.data.Results;
  } catch (error) {
    console.error("[NHTSA] Error fetching models:", error);
    throw new Error("فشل في جلب موديلات السيارة. يرجى التحقق من نوع السيارة.");
  }
};

// 3. Validate year for specific brand and model
export const validateYearForBrandModel = async (
  brand: string,
  model: string,
  year: number
): Promise<{
  isValid: boolean;
  message?: string;
  yearRange?: { min: number; max: number };
}> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    console.log("[NHTSA] Validating year for:", normalizedBrand, model, year);

    const response = await axios.get<NHTSAResponse<NHTSAModelYear>>(
      `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
        normalizedBrand
      )}/modelyear/${year}?format=json`
    );

    // Check if the model exists for this brand and year
    const modelExists = response.data.Results.some((result) =>
      result.Model_Name.toLowerCase().includes(model.toLowerCase())
    );

    if (!modelExists) {
      // Get year range for this brand/model
      const yearRangeResult = await getYearRangeForBrandModel(
        normalizedBrand,
        model
      );

      if (yearRangeResult.isValid) {
        return {
          isValid: false,
          message: `❌ هذه السنة لم يتم تصنيع هذا الموديل فيها. النطاق الصحيح: ${yearRangeResult.min} - ${yearRangeResult.max}`,
          yearRange: { min: yearRangeResult.min, max: yearRangeResult.max },
        };
      } else {
        return {
          isValid: false,
          message:
            "❌ هذه السنة لم يتم تصنيع هذا الموديل فيها. يرجى التحقق من السنة.",
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("[NHTSA] Error validating year:", error);
    return {
      isValid: false,
      message: "فشل في التحقق من السنة. يرجى المحاولة مرة أخرى.",
    };
  }
};

// Helper function to get year range for a brand/model (legacy version)
const getYearRangeForBrandModelLegacy = async (
  brand: string,
  model: string
): Promise<{ min: number; max: number } | null> => {
  try {
    // Try to get data for recent years to find the range
    const currentYear = new Date().getFullYear();
    const years = [];

    // Check last 30 years
    for (let year = currentYear; year >= currentYear - 30; year--) {
      try {
        const response = await axios.get<NHTSAResponse<NHTSAModelYear>>(
          `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
            brand
          )}/modelyear/${year}?format=json`
        );

        const modelExists = response.data.Results.some((result) =>
          result.Model_Name.toLowerCase().includes(model.toLowerCase())
        );

        if (modelExists) {
          years.push(year);
        }
      } catch (error) {
        // Continue to next year
        continue;
      }
    }

    if (years.length > 0) {
      return {
        min: Math.min(...years),
        max: Math.max(...years),
      };
    }

    return null;
  } catch (error) {
    console.error("[NHTSA] Error getting year range:", error);
    return null;
  }
};

// 4. Search brands with autocomplete
export const searchBrands = async (query: string): Promise<NHTSAMake[]> => {
  try {
    if (!query.trim()) return [];
    const allBrands = await getAllCarBrands();
    const normalizedQuery = query.toLowerCase();
    // Filter brands that match the query
    const matches = allBrands.filter(
      (brand) =>
        brand.Make_Name.toLowerCase().includes(normalizedQuery) ||
        brand.Make_Name.toLowerCase().startsWith(normalizedQuery)
    );
    // Return top 10 matches
    return matches.slice(0, 10);
  } catch (error) {
    console.error("[NHTSA] Error searching brands:", error);
    return [];
  }
};

// 5. Search models with autocomplete
export const searchModels = async (
  brand: string,
  query: string
): Promise<NHTSAModel[]> => {
  try {
    if (!query.trim()) return [];

    const allModels = await getModelsForBrand(brand);
    const normalizedQuery = query.toLowerCase();

    // Filter models that match the query
    const matches = allModels.filter(
      (model) =>
        model.Model_Name.toLowerCase().includes(normalizedQuery) ||
        model.Model_Name.toLowerCase().startsWith(normalizedQuery)
    );

    // Return top 10 matches
    return matches.slice(0, 10);
  } catch (error) {
    console.error("[NHTSA] Error searching models:", error);
    return [];
  }
};

// 6. Check if brand exists
export const validateBrand = async (
  brand: string
): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    const allBrands = await getAllCarBrands();

    const brandExists = allBrands.some(
      (b) => b.Make_Name.toLowerCase() === normalizedBrand.toLowerCase()
    );

    if (!brandExists) {
      return {
        isValid: false,
        message: "نوع السيارة غير معروف. يرجى التحقق.",
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("[NHTSA] Error validating brand:", error);
    return {
      isValid: false,
      message: "فشل في التحقق من نوع السيارة. يرجى المحاولة مرة أخرى.",
    };
  }
};

// 7. Check if model exists for brand
export const validateModel = async (
  brand: string,
  model: string
): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    const allModels = await getModelsForBrand(normalizedBrand);

    const modelExists = allModels.some((m) =>
      m.Model_Name.toLowerCase().includes(model.toLowerCase())
    );

    if (!modelExists) {
      return {
        isValid: false,
        message: "موديل السيارة غير معروف لهذا النوع. يرجى التحقق.",
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("[NHTSA] Error validating model:", error);
    return {
      isValid: false,
      message: "فشل في التحقق من موديل السيارة. يرجى المحاولة مرة أخرى.",
    };
  }
};

// 8. Check if input is a model and suggest brand
export const checkIfModelAndSuggestBrand = async (
  input: string
): Promise<{ isModel: boolean; suggestedBrand?: string; message?: string }> => {
  try {
    if (!input.trim() || input.trim().length < 2) {
      return { isModel: false };
    }

    // Get all brands first
    const allBrands = await getAllCarBrands();
    const normalizedInput = input.toLowerCase();

    // Check if input is a known brand first
    const isKnownBrand = allBrands.some(
      (brand) => brand.Make_Name.toLowerCase() === normalizedInput
    );

    if (isKnownBrand) {
      return { isModel: false };
    }

    // Check if input might be a model by searching across popular brands
    const popularBrands = [
      "Toyota",
      "Honda",
      "Nissan",
      "Hyundai",
      "Kia",
      "Ford",
      "Chevrolet",
      "BMW",
      "Mercedes-Benz",
      "Audi",
      "Lexus",
      "Dodge",
    ];

    for (const brand of popularBrands) {
      try {
        const models = await getModelsForBrand(brand);
        const matchingModel = models.find(
          (model) =>
            model.Model_Name.toLowerCase().includes(normalizedInput) ||
            model.Model_Name.toLowerCase() === normalizedInput
        );

        if (matchingModel) {
          return {
            isModel: true,
            suggestedBrand: brand,
            message: `${input} هو موديل، وليس نوع سيارة. هل تقصد ${brand}؟`,
          };
        }
      } catch (error) {
        // Continue to next brand
        continue;
      }
    }

    return { isModel: false };
  } catch (error) {
    console.error("[NHTSA] Error checking if input is model:", error);
    return { isModel: false };
  }
};

// 9. Get year range for brand/model with better error messages
export const getYearRangeForBrandModel = async (
  brand: string,
  model: string
): Promise<{
  min: number;
  max: number;
  isValid: boolean;
  message?: string;
}> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    const currentYear = new Date().getFullYear();
    const years = [];

    // Check last 50 years for better coverage
    for (let year = currentYear; year >= currentYear - 50; year--) {
      try {
        const response = await axios.get<NHTSAResponse<NHTSAModelYear>>(
          `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
            normalizedBrand
          )}/modelyear/${year}?format=json`
        );

        const modelExists = response.data.Results.some((result) =>
          result.Model_Name.toLowerCase().includes(model.toLowerCase())
        );

        if (modelExists) {
          years.push(year);
        }
      } catch (error) {
        // Continue to next year
        continue;
      }
    }

    if (years.length > 0) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      return {
        min,
        max,
        isValid: true,
        message: `✅ نطاق الإنتاج الصحيح: ${min} - ${max}`,
      };
    }

    return {
      min: 0,
      max: 0,
      isValid: false,
      message: "❌ لم يتم العثور على نطاق إنتاج لهذا الموديل",
    };
  } catch (error) {
    console.error("[NHTSA] Error getting year range:", error);
    return {
      min: 0,
      max: 0,
      isValid: false,
      message: "❌ فشل في الحصول على نطاق الإنتاج",
    };
  }
};
