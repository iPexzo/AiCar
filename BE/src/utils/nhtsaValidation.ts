import axios from "axios";

const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api";

interface NHTSAResponse<T> {
  Count: number;
  Message: string;
  Results: T[];
}

interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

interface NHTSAModelYear {
  Model_ID: number;
  Model_Name: string;
  Make_ID: number;
  Make_Name: string;
}

// Normalize brand names for better matching
const normalizeBrandName = (brand: string): string => {
  const brandMap: { [key: string]: string } = {
    تويوتا: "Toyota",
    هوندا: "Honda",
    نيسان: "Nissan",
    هيونداي: "Hyundai",
    كيا: "Kia",
    فورد: "Ford",
    شيفروليه: "Chevrolet",
    "بي ام دبليو": "BMW",
    مرسيدس: "Mercedes-Benz",
    أودي: "Audi",
    لكزس: "Lexus",
    دودج: "Dodge",
  };

  const normalized = brand.trim().toLowerCase();
  return brandMap[normalized] || brand.trim();
};

// 1. Get all car brands
export const getAllCarBrands = async (): Promise<NHTSAMake[]> => {
  try {
    const response = await axios.get<NHTSAResponse<NHTSAMake>>(
      `${NHTSA_BASE_URL}/vehicles/GetAllMakes?format=json`
    );
    return response.data.Results;
  } catch (error) {
    console.error("[NHTSA] Error fetching brands:", error);
    throw new Error("Failed to fetch car brands");
  }
};

// 2. Get models for a specific brand
export const getModelsForBrand = async (
  brand: string
): Promise<NHTSAModel[]> => {
  try {
    const normalizedBrand = normalizeBrandName(brand);
    const response = await axios.get<NHTSAResponse<NHTSAModel>>(
      `${NHTSA_BASE_URL}/vehicles/GetModelsForMake/${encodeURIComponent(
        normalizedBrand
      )}?format=json`
    );
    return response.data.Results;
  } catch (error) {
    console.error("[NHTSA] Error fetching models:", error);
    throw new Error("Failed to fetch car models");
  }
};

// 3. Search brands with autocomplete
export const searchBrands = async (query: string): Promise<NHTSAMake[]> => {
  try {
    const allBrands = await getAllCarBrands();
    const normalizedQuery = query.toLowerCase();

    return allBrands
      .filter((brand) =>
        brand.Make_Name.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error("[NHTSA] Error searching brands:", error);
    throw new Error("Failed to search brands");
  }
};

// 4. Search models for a brand with autocomplete
export const searchModels = async (
  brand: string,
  query: string
): Promise<NHTSAModel[]> => {
  try {
    const allModels = await getModelsForBrand(brand);
    const normalizedQuery = query.toLowerCase();

    return allModels
      .filter((model) =>
        model.Model_Name.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error("[NHTSA] Error searching models:", error);
    throw new Error("Failed to search models");
  }
};

// 5. Validate brand
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
        message: "نوع السيارة غير معروف. يرجى التحقق من الاسم.",
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

// 6. Validate year for brand/model
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

    const response = await axios.get<NHTSAResponse<NHTSAModelYear>>(
      `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
        normalizedBrand
      )}/modelyear/${year}?format=json`
    );

    const modelExists = response.data.Results.some((result) =>
      result.Model_Name.toLowerCase().includes(model.toLowerCase())
    );

    if (modelExists) {
      return { isValid: true };
    }

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
  } catch (error) {
    console.error("[NHTSA] Error validating year:", error);
    return {
      isValid: false,
      message: "❌ فشل في التحقق من السنة. يرجى المحاولة مرة أخرى.",
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
