import express from "express";
import axios from "axios";

const router = express.Router();

// CarQuery API configuration
const CAR_QUERY_BASE_URL = "https://www.carqueryapi.com/api/0.3/";

// Brand name mapping for API calls
const BRAND_MAPPING: { [key: string]: string } = {
  تويوتا: "toyota",
  toyota: "toyota",
  هوندا: "honda",
  honda: "honda",
  نيسان: "nissan",
  nissan: "nissan",
  دودج: "dodge",
  dodge: "dodge",
  هيونداي: "hyundai",
  hyundai: "hyundai",
  كيا: "kia",
  kia: "kia",
  فورد: "ford",
  ford: "ford",
  شيفروليه: "chevrolet",
  chevrolet: "chevrolet",
  "بي إم دبليو": "bmw",
  bmw: "bmw",
  مرسيدس: "mercedes-benz",
  mercedes: "mercedes-benz",
  أودي: "audi",
  audi: "audi",
  لكزس: "lexus",
  lexus: "lexus",
};

// Model name mapping for API calls
const MODEL_MAPPING: { [key: string]: string } = {
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
  جورني: "journey",
  دارت: "dart",
  كاليبر: "caliber",
  نايترو: "nitro",
};

// Cache for API responses
const yearRangeCache: { [key: string]: any } = {};

/**
 * GET /api/car-query/year-range
 * Fetch year range for a specific make and model
 */
router.get("/year-range", async (req, res) => {
  try {
    const { make, model } = req.query;

    if (!make || !model) {
      return res.status(400).json({
        success: false,
        error: "Make and model are required",
      });
    }

    const cacheKey = `${make.toString().toLowerCase()}-${model
      .toString()
      .toLowerCase()}`;

    // Check cache first
    if (yearRangeCache[cacheKey]) {
      console.log(`[CarQuery] Cache hit for ${make} ${model}`);
      return res.json({
        success: true,
        yearRange: yearRangeCache[cacheKey],
      });
    }

    // Map brand and model names to API format
    const apiMake =
      BRAND_MAPPING[make.toString().toLowerCase()] ||
      make.toString().toLowerCase();
    const apiModel =
      MODEL_MAPPING[model.toString().toLowerCase()] ||
      model.toString().toLowerCase();

    // Build API URL
    const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
      apiMake
    )}&model=${encodeURIComponent(apiModel)}`;

    console.log(`[CarQuery] Fetching year range for ${make} ${model}`);
    console.log(`[CarQuery] API URL: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
    });

    if (
      response.data &&
      response.data.Trims &&
      response.data.Trims.length > 0
    ) {
      // Extract years from all trims
      const years = response.data.Trims.map((trim: any) =>
        parseInt(trim.model_year)
      )
        .filter((year: number) => !isNaN(year))
        .sort((a: number, b: number) => a - b);

      if (years.length > 0) {
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        const currentYear = new Date().getFullYear();

        const yearRange = {
          minYear,
          maxYear: Math.max(maxYear, currentYear + 1), // Allow next year for new models
          modelName: response.data.Trims[0].model_name || model.toString(),
          makeName: response.data.Trims[0].make_display || make.toString(),
          isValid: true,
        };

        // Cache the result
        yearRangeCache[cacheKey] = yearRange;

        console.log(
          `[CarQuery] Success: ${make} ${model} (${minYear}-${maxYear})`
        );

        return res.json({
          success: true,
          yearRange,
        });
      }
    }

    // No data found, return fallback
    const fallbackRange = {
      minYear: 1900,
      maxYear: new Date().getFullYear() + 1,
      modelName: model.toString(),
      makeName: make.toString(),
      isValid: false,
      message: `No production data found for ${make} ${model}. Using general validation.`,
    };

    yearRangeCache[cacheKey] = fallbackRange;
    console.log(
      `[CarQuery] No data found for ${make} ${model}, using fallback`
    );

    return res.json({
      success: true,
      yearRange: fallbackRange,
    });
  } catch (error) {
    console.error(`[CarQuery] Error fetching year range:`, error);

    // Return fallback on error
    const fallbackRange = {
      minYear: 1900,
      maxYear: new Date().getFullYear() + 1,
      modelName: req.query.model?.toString() || "Unknown",
      makeName: req.query.make?.toString() || "Unknown",
      isValid: false,
      message: `Unable to fetch production data. Using general validation.`,
    };

    return res.json({
      success: true,
      yearRange: fallbackRange,
    });
  }
});

/**
 * POST /api/car-query/validate-year
 * Validate a year against the fetched year range
 */
router.post("/validate-year", async (req, res) => {
  try {
    const { make, model, year } = req.body;

    if (!make || !model || !year) {
      return res.status(400).json({
        success: false,
        error: "Make, model, and year are required",
      });
    }

    const yearNum = parseInt(year.toString());
    if (isNaN(yearNum)) {
      return res.status(400).json({
        success: false,
        error: "Year must be a valid number",
      });
    }

    // First, get the year range
    const cacheKey = `${make.toString().toLowerCase()}-${model
      .toString()
      .toLowerCase()}`;

    let yearRange;

    // Check cache first
    if (yearRangeCache[cacheKey]) {
      yearRange = yearRangeCache[cacheKey];
    } else {
      // Fetch from API
      const apiMake =
        BRAND_MAPPING[make.toString().toLowerCase()] ||
        make.toString().toLowerCase();
      const apiModel =
        MODEL_MAPPING[model.toString().toLowerCase()] ||
        model.toString().toLowerCase();

      const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
        apiMake
      )}&model=${encodeURIComponent(apiModel)}`;

      const response = await axios.get(url, { timeout: 10000 });

      if (
        response.data &&
        response.data.Trims &&
        response.data.Trims.length > 0
      ) {
        const years = response.data.Trims.map((trim: any) =>
          parseInt(trim.model_year)
        )
          .filter((year: number) => !isNaN(year))
          .sort((a: number, b: number) => a - b);

        if (years.length > 0) {
          const minYear = years[0];
          const maxYear = years[years.length - 1];
          const currentYear = new Date().getFullYear();

          yearRange = {
            minYear,
            maxYear: Math.max(maxYear, currentYear + 1),
            modelName: response.data.Trims[0].model_name || model.toString(),
            makeName: response.data.Trims[0].make_display || make.toString(),
            isValid: true,
          };

          yearRangeCache[cacheKey] = yearRange;
        }
      }

      if (!yearRange) {
        // Fallback validation
        const currentYear = new Date().getFullYear();
        yearRange = {
          minYear: 1900,
          maxYear: currentYear + 1,
          modelName: model.toString(),
          makeName: make.toString(),
          isValid: false,
          message: `No production data found for ${make} ${model}. Using general validation.`,
        };

        yearRangeCache[cacheKey] = yearRange;
      }
    }

    // Validate the year
    const isValid =
      yearNum >= yearRange.minYear && yearNum <= yearRange.maxYear;

    let message = "";
    if (!isValid) {
      message = `${yearRange.modelName} was not manufactured in ${yearNum} – please select a year between ${yearRange.minYear} and ${yearRange.maxYear}.`;
    }

    return res.json({
      success: true,
      isValid,
      message,
      yearRange,
    });
  } catch (error) {
    console.error("[CarQuery] Error in year validation:", error);

    // Fallback validation
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(req.body.year?.toString() || "0");
    const isValid = yearNum >= 1900 && yearNum <= currentYear + 1;

    return res.json({
      success: true,
      isValid,
      message: isValid
        ? ""
        : `Please select a year between 1900 and ${currentYear + 1}.`,
      yearRange: {
        minYear: 1900,
        maxYear: currentYear + 1,
        modelName: req.body.model?.toString() || "Unknown",
        makeName: req.body.make?.toString() || "Unknown",
        isValid: false,
        message: "Using fallback validation due to API error.",
      },
    });
  }
});

/**
 * DELETE /api/car-query/cache
 * Clear the cache (useful for testing or when data might be stale)
 */
router.delete("/cache", (req, res) => {
  const cacheSize = Object.keys(yearRangeCache).length;
  Object.keys(yearRangeCache).forEach((key) => delete yearRangeCache[key]);
  console.log(`[CarQuery] Cache cleared (${cacheSize} entries)`);

  return res.json({
    success: true,
    message: `Cache cleared (${cacheSize} entries)`,
  });
});

export default router;
