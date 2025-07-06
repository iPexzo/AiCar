import axios from "axios";

// CarQuery API configuration
const CAR_QUERY_BASE_URL = "https://www.carqueryapi.com/api/0.3/";

// Interface for CarQuery API response
interface CarQueryTrim {
  make_id: string;
  make_display: string;
  make_country: string;
  model_id: string;
  model_name: string;
  model_trim: string;
  model_year: string;
  model_body: string;
  model_engine_position: string;
  model_engine_cc: string;
  model_engine_cyl: string;
  model_engine_type: string;
  model_engine_valves_per_cyl: string;
  model_engine_power_ps: string;
  model_engine_power_rpm: string;
  model_engine_torque_nm: string;
  model_engine_torque_rpm: string;
  model_engine_bore_mm: string;
  model_engine_stroke_mm: string;
  model_engine_compression: string;
  model_engine_fuel: string;
  model_top_speed_kph: string;
  model_0_to_100_kph: string;
  model_drive: string;
  model_transmission_type: string;
  model_seats: string;
  model_doors: string;
  model_weight_kg: string;
  model_length_mm: string;
  model_width_mm: string;
  model_height_mm: string;
  model_wheelbase_mm: string;
  model_lkm_city: string;
  model_lkm_highway: string;
  model_fuel_cap_l: string;
  model_sold_in_us: string;
  model_co2: string;
  model_make_display: string;
}

interface CarQueryResponse {
  Trims: CarQueryTrim[];
}

// Interface for year range validation
export interface YearRange {
  minYear: number;
  maxYear: number;
  modelName: string;
  makeName: string;
  isValid: boolean;
  message?: string;
}

// Brand name mapping for API calls (English to API format)
const BRAND_MAPPING: { [key: string]: string } = {
  // Toyota
  تويوتا: "toyota",
  toyota: "toyota",

  // Honda
  هوندا: "honda",
  honda: "honda",

  // Nissan
  نيسان: "nissan",
  nissan: "nissan",

  // Hyundai
  هيونداي: "hyundai",
  hyundai: "hyundai",

  // Kia
  كيا: "kia",
  kia: "kia",

  // Ford
  فورد: "ford",
  ford: "ford",

  // Chevrolet
  شيفروليه: "chevrolet",
  chevrolet: "chevrolet",

  // BMW
  "بي إم دبليو": "bmw",
  bmw: "bmw",

  // Mercedes
  مرسيدس: "mercedes-benz",
  mercedes: "mercedes-benz",

  // Audi
  أودي: "audi",
  audi: "audi",

  // Lexus
  لكزس: "lexus",
  lexus: "lexus",

  // Dodge
  دودج: "dodge",
  dodge: "dodge",
};

// Model name mapping for API calls
const MODEL_MAPPING: { [key: string]: string } = {
  // Toyota models
  camry: "camry",
  corolla: "corolla",
  rav4: "rav4",
  highlander: "highlander",
  "land cruiser": "land-cruiser",
  prado: "land-cruiser-prado",
  fortuner: "fortuner",
  hilux: "hilux",
  yaris: "yaris",
  avalon: "avalon",
  prius: "prius",

  // Honda models
  civic: "civic",
  accord: "accord",
  "cr-v": "cr-v",
  pilot: "pilot",
  odyssey: "odyssey",
  fit: "fit",

  // Nissan models
  altima: "altima",
  sentra: "sentra",
  rogue: "rogue",
  murano: "murano",
  pathfinder: "pathfinder",
  maxima: "maxima",

  // Hyundai models
  elantra: "elantra",
  sonata: "sonata",
  tucson: "tucson",
  "santa fe": "santa-fe",
  accent: "accent",
  veloster: "veloster",

  // Kia models
  forte: "forte",
  optima: "optima",
  sportage: "sportage",
  sorento: "sorento",
  rio: "rio",
  soul: "soul",

  // Ford models
  focus: "focus",
  fusion: "fusion",
  escape: "escape",
  explorer: "explorer",
  "f-150": "f-150",
  mustang: "mustang",

  // Chevrolet models
  cruze: "cruze",
  malibu: "malibu",
  equinox: "equinox",
  tahoe: "tahoe",
  silverado: "silverado",
  camaro: "camaro",

  // BMW models
  "3 series": "3-series",
  "5 series": "5-series",
  x3: "x3",
  x5: "x5",
  m3: "m3",
  m5: "m5",

  // Mercedes models
  "c-class": "c-class",
  "e-class": "e-class",
  "s-class": "s-class",
  gla: "gla",
  glc: "glc",
  gle: "gle",

  // Audi models
  a3: "a3",
  a4: "a4",
  a6: "a6",
  q3: "q3",
  q5: "q5",
  q7: "q7",

  // Lexus models
  es: "es",
  is: "is",
  rx: "rx",
  nx: "nx",
  ls: "ls",
  gs: "gs",

  // Dodge models
  charger: "charger",
  challenger: "challenger",
  durango: "durango",
  journey: "journey",
  ram: "ram",
  dart: "dart",
  caliber: "caliber",
  nitro: "nitro",

  // Arabic variations for Dodge models
  تشالنجر: "challenger",
  تشارجر: "charger",
  دورانجو: "durango",
  جورني: "journey",
  دارت: "dart",
  كاليبر: "caliber",
  نايترو: "nitro",
};

// Cache for API responses to avoid repeated calls
const yearRangeCache: { [key: string]: YearRange } = {};

/**
 * Fetch year range for a specific make and model from CarQuery API
 */
export const fetchYearRange = async (
  make: string,
  model: string
): Promise<YearRange> => {
  const cacheKey = `${make.toLowerCase()}-${model.toLowerCase()}`;

  // Check cache first
  if (yearRangeCache[cacheKey]) {
    return yearRangeCache[cacheKey];
  }

  try {
    // Map brand and model names to API format
    const apiMake = BRAND_MAPPING[make.toLowerCase()] || make.toLowerCase();
    const apiModel = MODEL_MAPPING[model.toLowerCase()] || model.toLowerCase();

    // Build API URL
    const url = `${CAR_QUERY_BASE_URL}?cmd=getTrims&make=${encodeURIComponent(
      apiMake
    )}&model=${encodeURIComponent(apiModel)}`;

    console.log(`[CarQuery] Fetching year range for ${make} ${model}`);
    console.log(`[CarQuery] API URL: ${url}`);

    const response = await axios.get<CarQueryResponse>(url, {
      timeout: 10000,
    });

    if (
      response.data &&
      response.data.Trims &&
      response.data.Trims.length > 0
    ) {
      // Extract years from all trims
      const years = response.data.Trims.map((trim) => parseInt(trim.model_year))
        .filter((year) => !isNaN(year))
        .sort((a, b) => a - b);

      if (years.length > 0) {
        const minYear = years[0];
        const maxYear = years[years.length - 1];
        const currentYear = new Date().getFullYear();

        const yearRange: YearRange = {
          minYear,
          maxYear: Math.max(maxYear, currentYear + 1), // Allow next year for new models
          modelName: response.data.Trims[0].model_name || model,
          makeName: response.data.Trims[0].make_display || make,
          isValid: true,
        };

        // Cache the result
        yearRangeCache[cacheKey] = yearRange;

        console.log(
          `[CarQuery] Success: ${make} ${model} (${minYear}-${maxYear})`
        );
        return yearRange;
      }
    }

    // No data found, return fallback
    const fallbackRange: YearRange = {
      minYear: 1900,
      maxYear: new Date().getFullYear() + 1,
      modelName: model,
      makeName: make,
      isValid: false,
      message: `No production data found for ${make} ${model}. Using general validation.`,
    };

    yearRangeCache[cacheKey] = fallbackRange;
    console.log(
      `[CarQuery] No data found for ${make} ${model}, using fallback`
    );
    return fallbackRange;
  } catch (error) {
    console.error(
      `[CarQuery] Error fetching year range for ${make} ${model}:`,
      error
    );

    // Return fallback on error
    const fallbackRange: YearRange = {
      minYear: 1900,
      maxYear: new Date().getFullYear() + 1,
      modelName: model,
      makeName: make,
      isValid: false,
      message: `Unable to fetch production data for ${make} ${model}. Using general validation.`,
    };

    yearRangeCache[cacheKey] = fallbackRange;
    return fallbackRange;
  }
};

/**
 * Validate a year against the fetched year range
 */
export const validateYearWithAPI = async (
  make: string,
  model: string,
  year: number
): Promise<{ isValid: boolean; message?: string; yearRange?: YearRange }> => {
  try {
    const yearRange = await fetchYearRange(make, model);

    if (year < yearRange.minYear || year > yearRange.maxYear) {
      return {
        isValid: false,
        message: `${yearRange.modelName} was not manufactured in ${year} – please select a year between ${yearRange.minYear} and ${yearRange.maxYear}.`,
        yearRange,
      };
    }

    return {
      isValid: true,
      yearRange,
    };
  } catch (error) {
    console.error("[CarQuery] Error in year validation:", error);

    // Fallback validation
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      return {
        isValid: false,
        message: `Please select a year between 1900 and ${currentYear + 1}.`,
      };
    }

    return { isValid: true };
  }
};

/**
 * Clear the cache (useful for testing or when data might be stale)
 */
export const clearYearRangeCache = () => {
  Object.keys(yearRangeCache).forEach((key) => delete yearRangeCache[key]);
  console.log("[CarQuery] Cache cleared");
};

/**
 * Get cached year range if available
 */
export const getCachedYearRange = (
  make: string,
  model: string
): YearRange | null => {
  const cacheKey = `${make.toLowerCase()}-${model.toLowerCase()}`;
  return yearRangeCache[cacheKey] || null;
};
