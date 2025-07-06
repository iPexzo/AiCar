import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import Fuse from "fuse.js";
import {
  getAllCarBrands,
  getModelsForBrand,
  validateYearForBrandModel,
  searchBrands,
  searchModels,
  validateBrand,
  validateModel,
  checkIfModelAndSuggestBrand,
  getYearRangeForBrandModel,
  NHTSAMake,
  NHTSAModel,
} from "../api/nhtsa";
import { analyzeCarProblem, CarAnalysisPayload } from "../api/analyze";

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

interface IntelligentCarDiagnosisProps {
  onAnalysisComplete: (result: any) => void;
}

interface FormData {
  carBrand: string;
  carModel: string;
  carYear: string;
  mileage: string;
  problemDescription: string;
}

interface FormErrors {
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  mileage?: string;
  problemDescription?: string;
}

interface LiveFeedback {
  type: "success" | "error" | "warning" | "info" | "suggestion";
  message: string;
  field?: string;
  suggestedBrand?: string;
  suggestion?: string;
  onSuggestionPress?: () => void;
}

interface AutocompleteItem {
  id: string;
  name: string;
  type: "brand" | "model";
}

export const IntelligentCarDiagnosis: React.FC<
  IntelligentCarDiagnosisProps
> = ({ onAnalysisComplete }) => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    carBrand: "",
    carModel: "",
    carYear: "",
    mileage: "",
    problemDescription: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Live feedback state
  const [liveFeedback, setLiveFeedback] = useState<LiveFeedback | null>(null);
  const [isValidatingBrand, setIsValidatingBrand] = useState(false);
  const [isValidatingModel, setIsValidatingModel] = useState(false);
  const [isValidatingYear, setIsValidatingYear] = useState(false);

  // Form validation state
  const [isFormReady, setIsFormReady] = useState(false);

  // Autocomplete state
  const [brandSuggestions, setBrandSuggestions] = useState<NHTSAMake[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<NHTSAModel[]>([]);
  const [showBrandAutocomplete, setShowBrandAutocomplete] = useState(false);
  const [showModelAutocomplete, setShowModelAutocomplete] = useState(false);

  // Validation state
  const [brandValidated, setBrandValidated] = useState(false);
  const [modelValidated, setModelValidated] = useState(false);
  const [yearValidated, setYearValidated] = useState(false);

  // Refs for input focus and positioning
  const brandInputRef = useRef<TextInput>(null);
  const modelInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);
  const mileageInputRef = useRef<TextInput>(null);
  const problemInputRef = useRef<TextInput>(null);

  // Refs for container positioning
  const brandContainerRef = useRef<View>(null);
  const modelContainerRef = useRef<View>(null);

  // Cache for API results
  const [brandCache, setBrandCache] = useState<{ [key: string]: NHTSAMake[] }>(
    {}
  );
  const [modelCache, setModelCache] = useState<{ [key: string]: NHTSAModel[] }>(
    {}
  );
  const [allBrandsCache, setAllBrandsCache] = useState<NHTSAMake[]>([]);

  // Loading states for better UX
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Debounce timer for search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const modelSearchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce timer for year validation
  const yearValidationTimeoutRef = useRef<NodeJS.Timeout>();

  // Fuzzy search configuration
  const fuseOptions = {
    threshold: 0.3, // Lower threshold = more strict matching
    distance: 100, // Maximum edit distance
    keys: ["Make_Name", "Model_Name"], // Search in these fields
    includeScore: true, // Include match scores
    minMatchCharLength: 2, // Minimum characters to match
  };

  // Load all brands on component mount
  useEffect(() => {
    loadAllBrands();
  }, []);

  // Handle screen size changes
  useEffect(() => {
    // Cache cleanup logic moved to separate useEffect
  }, []);

  // Cache cleanup to prevent memory leaks
  useEffect(() => {
    const cleanupCache = () => {
      // Clear old cache entries (keep only last 20 entries)
      const brandCacheKeys = Object.keys(brandCache);
      if (brandCacheKeys.length > 20) {
        const newBrandCache: { [key: string]: NHTSAMake[] } = {};
        brandCacheKeys.slice(-20).forEach((key) => {
          newBrandCache[key] = brandCache[key];
        });
        setBrandCache(newBrandCache);
      }

      const modelCacheKeys = Object.keys(modelCache);
      if (modelCacheKeys.length > 20) {
        const newModelCache: { [key: string]: NHTSAModel[] } = {};
        modelCacheKeys.slice(-20).forEach((key) => {
          newModelCache[key] = modelCache[key];
        });
        setModelCache(newModelCache);
      }
    };

    cleanupCache();
  }, [brandCache, modelCache]);

  // Reset model and year when brand changes
  useEffect(() => {
    if (formData.carBrand && !brandValidated) {
      // Brand is being changed, reset dependent fields
      setFormData((prev) => ({
        ...prev,
        carModel: "",
        carYear: "",
      }));
      setModelValidated(false);
      setYearValidated(false);
      setModelSuggestions([]);
      setShowModelAutocomplete(false);
      setLiveFeedback(null);
    }
  }, [formData.carBrand, brandValidated]);

  // Check if form is ready for submission
  useEffect(() => {
    const isReady =
      brandValidated &&
      modelValidated &&
      yearValidated &&
      formData.mileage.trim() !== "" &&
      formData.problemDescription.trim().length >= 10 &&
      !isValidatingBrand &&
      !isValidatingModel &&
      !isValidatingYear;

    setIsFormReady(isReady);
  }, [
    brandValidated,
    modelValidated,
    yearValidated,
    formData.mileage,
    formData.problemDescription,
    isValidatingBrand,
    isValidatingModel,
    isValidatingYear,
  ]);

  const loadAllBrands = async () => {
    try {
      // Check cache first
      if (allBrandsCache.length > 0) {
        setBrandSuggestions(allBrandsCache.slice(0, 10));
        return;
      }

      setIsLoadingBrands(true);
      const brands = await getAllCarBrands();
      setAllBrandsCache(brands);
      setBrandSuggestions(brands.slice(0, 10)); // Show first 10 brands initially
    } catch (error) {
      console.error("Error loading brands:", error);
      Alert.alert("خطأ", "فشل في تحميل أنواع السيارات");
    } finally {
      setIsLoadingBrands(false);
    }
  };

  // Preload models for a brand in background
  const preloadModelsForBrand = async (brand: string) => {
    try {
      const cacheKey = `${brand.toLowerCase()}_all`;
      if (!modelCache[cacheKey]) {
        const models = await getModelsForBrand(brand);
        setModelCache((prev) => ({
          ...prev,
          [cacheKey]: models,
        }));
      }
    } catch (error) {
      console.error("Error preloading models:", error);
    }
  };

  // Handle brand change and clear dependent fields
  const handleBrandChangeAndClear = (newBrand: string) => {
    setFormData((prev) => ({
      ...prev,
      carBrand: newBrand,
      carModel: "",
      carYear: "",
    }));
    setBrandValidated(true);
    setModelValidated(false);
    setYearValidated(false);
    setModelSuggestions([]);
    setShowModelAutocomplete(false);
    setLiveFeedback(null);

    // Clear model cache when brand changes
    setModelCache({});
  };

  // Enhanced brand input with proper positioning and caching
  const handleBrandFocus = () => {
    setShowBrandAutocomplete(true);

    // Show cached brands immediately if available
    if (allBrandsCache.length > 0) {
      setBrandSuggestions(allBrandsCache.slice(0, 10));
    }
  };

  // Enhanced model input with proper positioning and caching
  const handleModelFocus = () => {
    setShowModelAutocomplete(true);

    // Show cached models immediately if available
    const cacheKey = `${formData.carBrand.toLowerCase()}_all`;
    if (modelCache[cacheKey]) {
      setModelSuggestions(modelCache[cacheKey].slice(0, 10));
    }
  };

  // Handle brand input change with enhanced validation and caching
  const handleBrandChange = async (text: string) => {
    setFormData((prev) => ({ ...prev, carBrand: text }));
    setBrandValidated(false);
    setErrors((prev) => ({ ...prev, carBrand: undefined }));

    // Debounce search and validation
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (text.trim().length >= 2) {
        setIsValidatingBrand(true);
        try {
          // Check cache first
          const cacheKey = text.toLowerCase().trim();
          let brands: NHTSAMake[] = [];

          if (brandCache[cacheKey]) {
            brands = brandCache[cacheKey];
          } else {
            // Use fuzzy search on all brands
            if (allBrandsCache.length > 0) {
              brands = fuzzySearchBrands(text, allBrandsCache);
            } else {
              brands = await searchBrands(text);
            }

            // Cache the results
            setBrandCache((prev) => ({
              ...prev,
              [cacheKey]: brands,
            }));
          }

          setBrandSuggestions(brands);
          setShowBrandAutocomplete(true);

          // Check for typo correction
          if (text.length >= 3 && allBrandsCache.length > 0) {
            const correction = getTypoCorrection(
              text,
              allBrandsCache,
              "Make_Name"
            );
            if (correction && correction.toLowerCase() !== text.toLowerCase()) {
              setLiveFeedback({
                type: "suggestion",
                message: `هل تقصد "${correction}"؟`,
                suggestion: correction,
                onSuggestionPress: () => {
                  handleBrandChangeAndClear(correction);
                  setShowBrandAutocomplete(false);
                  setLiveFeedback({
                    type: "success",
                    message: `✅ تم اختيار ${correction} بنجاح`,
                  });
                },
              });
            }
          }
        } catch (error) {
          console.error("Error searching brands:", error);
          setBrandSuggestions([]);
        } finally {
          setIsValidatingBrand(false);
        }
      } else {
        setBrandSuggestions([]);
        setShowBrandAutocomplete(false);
      }
    }, 200);
  };

  // Handle model input change with enhanced validation and caching
  const handleModelChange = async (text: string) => {
    setFormData((prev) => ({ ...prev, carModel: text }));
    setModelValidated(false);
    setErrors((prev) => ({ ...prev, carModel: undefined }));

    // Debounce search and validation
    if (modelSearchTimeoutRef.current) {
      clearTimeout(modelSearchTimeoutRef.current);
    }

    modelSearchTimeoutRef.current = setTimeout(async () => {
      if (text.trim().length >= 2 && formData.carBrand) {
        setIsValidatingModel(true);
        try {
          // Check cache first for model suggestions
          const cacheKey = `${formData.carBrand.toLowerCase()}_${text
            .toLowerCase()
            .trim()}`;
          let models: NHTSAModel[] = [];

          if (modelCache[cacheKey]) {
            models = modelCache[cacheKey];
          } else {
            // Get all models for the brand first
            const allModelsKey = `${formData.carBrand.toLowerCase()}_all`;
            let allModels: NHTSAModel[] = [];

            if (modelCache[allModelsKey]) {
              allModels = modelCache[allModelsKey];
            } else {
              allModels = await getModelsForBrand(formData.carBrand);
              setModelCache((prev) => ({
                ...prev,
                [allModelsKey]: allModels,
              }));
            }

            // Use fuzzy search on all models for this brand
            models = fuzzySearchModels(text, allModels);

            // Cache the filtered results
            setModelCache((prev) => ({
              ...prev,
              [cacheKey]: models,
            }));
          }

          setModelSuggestions(models);
          setShowModelAutocomplete(true);

          // Check for typo correction
          if (text.length >= 3) {
            const allModelsKey = `${formData.carBrand.toLowerCase()}_all`;
            const allModels = modelCache[allModelsKey] || [];
            if (allModels.length > 0) {
              const correction = getTypoCorrection(
                text,
                allModels,
                "Model_Name"
              );
              if (
                correction &&
                correction.toLowerCase() !== text.toLowerCase()
              ) {
                setLiveFeedback({
                  type: "suggestion",
                  message: `هل تقصد "${correction}"؟`,
                  suggestion: correction,
                  onSuggestionPress: () => {
                    setFormData((prev) => ({ ...prev, carModel: correction }));
                    setModelValidated(true);
                    setShowModelAutocomplete(false);
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error("Error searching models:", error);
          setModelSuggestions([]);
        } finally {
          setIsValidatingModel(false);
        }
      } else {
        setModelSuggestions([]);
        setShowModelAutocomplete(false);
      }
    }, 200);
  };

  // Handle year input change with enhanced validation and debouncing
  const handleYearChange = async (text: string) => {
    setFormData((prev) => ({ ...prev, carYear: text }));
    setYearValidated(false);
    setErrors((prev) => ({ ...prev, carYear: undefined }));

    // Clear previous validation timeout
    if (yearValidationTimeoutRef.current) {
      clearTimeout(yearValidationTimeoutRef.current);
    }

    // Basic validation for format
    if (text.trim().length > 0 && text.trim().length !== 4) {
      setLiveFeedback({
        type: "error",
        message: "❌ يرجى إدخال سنة صحيحة (4 أرقام)",
        field: "carYear",
      });
      return;
    }

    if (text.trim().length === 0) {
      setLiveFeedback(null);
      return;
    }

    // Debounce year validation (500ms)
    yearValidationTimeoutRef.current = setTimeout(async () => {
      if (text.trim().length === 4 && formData.carBrand && formData.carModel) {
        const year = parseInt(text);
        if (
          !isNaN(year) &&
          year >= 1900 &&
          year <= new Date().getFullYear() + 1
        ) {
          setIsValidatingYear(true);
          try {
            const validation = await validateYearForBrandModel(
              formData.carBrand,
              formData.carModel,
              year
            );

            if (validation.isValid) {
              setLiveFeedback({
                type: "success",
                message: "✅ سنة إنتاج صحيحة",
                field: "carYear",
              });
              setYearValidated(true);
              // Clear any error in the input field
              setErrors((prev) => ({ ...prev, carYear: undefined }));
            } else {
              setLiveFeedback({
                type: "error",
                message: validation.message || "❌ سنة إنتاج غير صحيحة",
                field: "carYear",
              });
              // Don't set error in both places - only in live feedback
              setErrors((prev) => ({ ...prev, carYear: undefined }));
            }
          } catch (error) {
            console.error("Error validating year:", error);
            setLiveFeedback({
              type: "error",
              message: "❌ فشل في التحقق من السنة",
              field: "carYear",
            });
            setErrors((prev) => ({ ...prev, carYear: undefined }));
          } finally {
            setIsValidatingYear(false);
          }
        } else {
          setLiveFeedback({
            type: "error",
            message: "❌ يرجى إدخال سنة صحيحة (4 أرقام)",
            field: "carYear",
          });
        }
      }
    }, 500);
  };

  // Handle mileage input change
  const handleMileageChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, mileage: numericText }));
    setErrors((prev) => ({ ...prev, mileage: undefined }));
  };

  // Handle problem description change
  const handleProblemChange = (text: string) => {
    setFormData((prev) => ({ ...prev, problemDescription: text }));
    setErrors((prev) => ({ ...prev, problemDescription: undefined }));
  };

  // Select brand from autocomplete
  const selectBrand = (brand: NHTSAMake) => {
    handleBrandChangeAndClear(brand.Make_Name);
    setErrors((prev) => ({ ...prev, carBrand: undefined }));
    setShowBrandAutocomplete(false);
    setLiveFeedback({
      type: "success",
      message: `✅ تم اختيار ${brand.Make_Name} بنجاح`,
    });

    // Preload all models for this brand in background
    preloadModelsForBrand(brand.Make_Name);

    // Focus on model input after a short delay
    setTimeout(() => {
      modelInputRef.current?.focus();
    }, 300);
  };

  // Select model from autocomplete
  const selectModel = (model: NHTSAModel) => {
    setFormData((prev) => ({ ...prev, carModel: model.Model_Name }));
    setModelValidated(true);
    setErrors((prev) => ({ ...prev, carModel: undefined }));
    setShowModelAutocomplete(false);
    setLiveFeedback({
      type: "success",
      message: `✅ تم اختيار ${model.Model_Name} بنجاح`,
    });

    // Focus on year input after a short delay
    setTimeout(() => {
      yearInputRef.current?.focus();
    }, 300);
  };

  // Handle brand suggestion click
  const handleBrandSuggestion = (suggestedBrand: string) => {
    setFormData((prev) => ({
      ...prev,
      carBrand: suggestedBrand,
      carModel: "", // Clear model
      carYear: "", // Clear year
    }));
    setBrandValidated(true);
    setModelValidated(false);
    setYearValidated(false);
    setModelSuggestions([]);
    setLiveFeedback({
      type: "success",
      message: `✅ تم اختيار النوع: ${suggestedBrand}`,
      field: "carBrand",
    });
    setShowBrandAutocomplete(false);

    // Focus on model input
    modelInputRef.current?.focus();
  };

  // Validate form before submission
  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    // Validate brand
    if (!formData.carBrand.trim()) {
      newErrors.carBrand = "نوع السيارة مطلوب";
    } else if (!brandValidated) {
      try {
        const validation = await validateBrand(formData.carBrand);
        if (!validation.isValid) {
          newErrors.carBrand = validation.message;
        } else {
          setBrandValidated(true);
        }
      } catch (error) {
        newErrors.carBrand = "فشل في التحقق من نوع السيارة";
      }
    }

    // Validate model
    if (!formData.carModel.trim()) {
      newErrors.carModel = "موديل السيارة مطلوب";
    } else if (!modelValidated && formData.carBrand) {
      try {
        const validation = await validateModel(
          formData.carBrand,
          formData.carModel
        );
        if (!validation.isValid) {
          newErrors.carModel = validation.message;
        } else {
          setModelValidated(true);
        }
      } catch (error) {
        newErrors.carModel = "فشل في التحقق من موديل السيارة";
      }
    }

    // Validate year
    if (!formData.carYear.trim()) {
      newErrors.carYear = "سنة الصنع مطلوبة";
    } else {
      const year = parseInt(formData.carYear);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        newErrors.carYear = "سنة غير صحيحة";
      } else if (!yearValidated && formData.carBrand && formData.carModel) {
        try {
          const validation = await validateYearForBrandModel(
            formData.carBrand,
            formData.carModel,
            year
          );
          if (!validation.isValid) {
            newErrors.carYear = validation.message;
          } else {
            setYearValidated(true);
          }
        } catch (error) {
          newErrors.carYear = "فشل في التحقق من السنة";
        }
      }
    }

    // Validate mileage
    if (!formData.mileage.trim()) {
      newErrors.mileage = "الممشى مطلوب";
    } else {
      const mileage = parseInt(formData.mileage);
      if (isNaN(mileage) || mileage < 0) {
        newErrors.mileage = "الممشى يجب أن يكون رقم موجب";
      }
    }

    // Validate problem description
    if (!formData.problemDescription.trim()) {
      newErrors.problemDescription = "شرح المشكلة مطلوب";
    } else if (formData.problemDescription.trim().length < 10) {
      newErrors.problemDescription = "شرح المشكلة يجب أن يكون أكثر من 10 أحرف";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleAnalyze = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      Alert.alert("خطأ في البيانات", "يرجى تصحيح الأخطاء قبل المتابعة");
      return;
    }

    setIsAnalyzing(true);
    try {
      const payload: CarAnalysisPayload = {
        carType: formData.carBrand,
        carModel: formData.carModel,
        mileage: formData.mileage,
        problemDescription: formData.problemDescription,
        step: "initial", // Start with initial analysis
      };

      const result = await analyzeCarProblem(payload);
      onAnalysisComplete(result);
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("خطأ", "فشل في تحليل المشكلة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render autocomplete item
  const renderAutocompleteItem = ({
    item,
    type,
  }: {
    item: NHTSAMake | NHTSAModel;
    type: "brand" | "model";
  }) => (
    <TouchableOpacity
      style={{
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        backgroundColor: CARD,
      }}
      onPress={() => {
        if (type === "brand") {
          selectBrand(item as NHTSAMake);
        } else {
          selectModel(item as NHTSAModel);
        }
      }}
    >
      <Text style={{ color: TEXT, fontSize: 16 }}>
        {type === "brand"
          ? (item as NHTSAMake).Make_Name
          : (item as NHTSAModel).Model_Name}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced autocomplete container component
  const AutocompleteContainer = ({
    visible,
    suggestions,
    position,
    onSelect,
    type,
    maxHeight = 200,
    isLoading = false,
  }: {
    visible: boolean;
    suggestions: any[];
    position: { top: number; left: number; width: number };
    onSelect: (item: any) => void;
    type: "brand" | "model";
    maxHeight?: number;
    isLoading?: boolean;
  }) => {
    if (!visible) return null;

    return (
      <View
        style={{
          position: "relative",
          backgroundColor: CARD,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: BORDER,
          maxHeight: maxHeight,
          marginTop: 5,
          zIndex: 9999,
          elevation: 10, // Android shadow
          shadowColor: SHADOW,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        {isLoading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={{ color: SUBTEXT, marginTop: 8, fontSize: 14 }}>
              جاري التحميل...
            </Text>
          </View>
        ) : suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) =>
              type === "brand"
                ? item.Make_ID.toString()
                : item.Model_ID.toString()
            }
            renderItem={({ item }) => renderAutocompleteItem({ item, type })}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          />
        ) : (
          <View style={{ padding: 15, alignItems: "center" }}>
            <Text style={{ color: SUBTEXT, fontSize: 14 }}>لا توجد نتائج</Text>
          </View>
        )}
      </View>
    );
  };

  // Handle scroll to close dropdowns
  const handleScroll = () => {
    setShowBrandAutocomplete(false);
    setShowModelAutocomplete(false);
  };

  // Render input field with error
  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    keyboardType: "default" | "numeric" = "default",
    ref?: React.RefObject<TextInput>,
    multiline = false,
    numberOfLines = 1,
    showLoading = false
  ) => (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          color: TEXT,
          fontSize: 16,
          marginBottom: 8,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      <View style={{ position: "relative" }}>
        <TextInput
          ref={ref}
          style={{
            backgroundColor: INPUT_BG,
            borderWidth: 1,
            borderColor: error ? ERROR : BORDER,
            borderRadius: 8,
            padding: 15,
            color: TEXT,
            fontSize: 16,
            minHeight: multiline ? 100 : 50,
            paddingRight: showLoading ? 50 : 15,
          }}
          placeholder={placeholder}
          placeholderTextColor={SUBTEXT}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
        />
        {showLoading && (
          <View
            style={{
              position: "absolute",
              right: 15,
              top: 15,
            }}
          >
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
        )}
      </View>
      {error && (
        <Text style={{ color: ERROR, fontSize: 14, marginTop: 5 }}>
          {error}
        </Text>
      )}
    </View>
  );

  // Fuzzy search for brands
  const fuzzySearchBrands = (
    query: string,
    brands: NHTSAMake[]
  ): NHTSAMake[] => {
    if (!query || query.length < 2) return brands.slice(0, 10);

    const fuse = new Fuse(brands, {
      ...fuseOptions,
      keys: ["Make_Name"],
    });

    const results = fuse.search(query);
    return results.slice(0, 10).map((result) => result.item);
  };

  // Fuzzy search for models
  const fuzzySearchModels = (
    query: string,
    models: NHTSAModel[]
  ): NHTSAModel[] => {
    if (!query || query.length < 2) return models.slice(0, 10);

    const fuse = new Fuse(models, {
      ...fuseOptions,
      keys: ["Model_Name"],
    });

    const results = fuse.search(query);
    return results.slice(0, 10).map((result) => result.item);
  };

  // Get typo correction suggestion
  const getTypoCorrection = (
    query: string,
    items: any[],
    key: string
  ): string | null => {
    if (!query || query.length < 3) return null;

    const fuse = new Fuse(items, {
      threshold: 0.4,
      distance: 50,
      keys: [key],
      includeScore: true,
    });

    const results = fuse.search(query);
    if (results.length > 0 && results[0].score && results[0].score < 0.3) {
      return results[0].item[key];
    }

    return null;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={{ padding: 20 }}>
        <Text
          style={{
            color: TEXT,
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          تشخيص مشاكل السيارة
        </Text>

        {/* Live Feedback Component */}
        {liveFeedback && (
          <View
            style={{
              backgroundColor:
                liveFeedback.type === "success"
                  ? SUCCESS + "20"
                  : liveFeedback.type === "error"
                  ? ERROR + "20"
                  : liveFeedback.type === "warning"
                  ? WARNING + "20"
                  : liveFeedback.type === "suggestion"
                  ? ACCENT + "20"
                  : CARD,
              borderWidth: 1,
              borderColor:
                liveFeedback.type === "success"
                  ? SUCCESS
                  : liveFeedback.type === "error"
                  ? ERROR
                  : liveFeedback.type === "warning"
                  ? WARNING
                  : liveFeedback.type === "suggestion"
                  ? ACCENT
                  : BORDER,
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color:
                    liveFeedback.type === "success"
                      ? SUCCESS
                      : liveFeedback.type === "error"
                      ? ERROR
                      : liveFeedback.type === "warning"
                      ? WARNING
                      : liveFeedback.type === "suggestion"
                      ? ACCENT
                      : TEXT,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                {liveFeedback.message}
              </Text>

              {/* Suggestion button */}
              {liveFeedback.type === "suggestion" &&
                liveFeedback.suggestion &&
                liveFeedback.onSuggestionPress && (
                  <TouchableOpacity
                    onPress={liveFeedback.onSuggestionPress}
                    style={{
                      backgroundColor: ACCENT,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      marginTop: 8,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      style={{ color: TEXT, fontSize: 12, fontWeight: "600" }}
                    >
                      استخدم "{liveFeedback.suggestion}"
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
              onPress={() => setLiveFeedback(null)}
              style={{
                padding: 4,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: SUBTEXT, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Car Brand Input with Autocomplete */}
        <View
          ref={brandContainerRef}
          style={{ marginBottom: 20, position: "relative" }}
        >
          <Text
            style={{
              color: TEXT,
              fontSize: 16,
              marginBottom: 8,
              fontWeight: "600",
            }}
          >
            نوع السيارة
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              ref={brandInputRef}
              style={{
                backgroundColor: INPUT_BG,
                borderWidth: 1,
                borderColor: errors.carBrand ? ERROR : BORDER,
                borderRadius: 8,
                padding: 15,
                color: TEXT,
                fontSize: 16,
                minHeight: 50,
                paddingRight: isValidatingBrand ? 50 : 15,
              }}
              placeholder="مثال: تويوتا، هوندا، نيسان..."
              placeholderTextColor={SUBTEXT}
              value={formData.carBrand}
              onChangeText={handleBrandChange}
              onFocus={handleBrandFocus}
              onBlur={() =>
                setTimeout(() => setShowBrandAutocomplete(false), 200)
              }
            />
            {isValidatingBrand && (
              <View
                style={{
                  position: "absolute",
                  right: 15,
                  top: 15,
                }}
              >
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            )}
          </View>
          {errors.carBrand && (
            <Text style={{ color: ERROR, fontSize: 14, marginTop: 5 }}>
              {errors.carBrand}
            </Text>
          )}

          {/* Brand Autocomplete with proper positioning */}
          <AutocompleteContainer
            visible={showBrandAutocomplete}
            suggestions={brandSuggestions}
            position={{ top: 0, left: 0, width: 0 }}
            onSelect={selectBrand}
            type="brand"
            isLoading={isLoadingBrands}
          />
        </View>

        {/* Car Model Input with Autocomplete */}
        <View
          ref={modelContainerRef}
          style={{ marginBottom: 20, position: "relative" }}
        >
          <Text
            style={{
              color: TEXT,
              fontSize: 16,
              marginBottom: 8,
              fontWeight: "600",
            }}
          >
            موديل السيارة
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              ref={modelInputRef}
              style={{
                backgroundColor: INPUT_BG,
                borderWidth: 1,
                borderColor: errors.carModel ? ERROR : BORDER,
                borderRadius: 8,
                padding: 15,
                color: TEXT,
                fontSize: 16,
                minHeight: 50,
                paddingRight: isValidatingModel ? 50 : 15,
              }}
              placeholder="مثال: كامري، تشالنجر..."
              placeholderTextColor={SUBTEXT}
              value={formData.carModel}
              onChangeText={handleModelChange}
              onFocus={handleModelFocus}
              onBlur={() =>
                setTimeout(() => setShowModelAutocomplete(false), 200)
              }
              editable={!!formData.carBrand}
            />
            {isValidatingModel && (
              <View
                style={{
                  position: "absolute",
                  right: 15,
                  top: 15,
                }}
              >
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            )}
          </View>
          {errors.carModel && (
            <Text style={{ color: ERROR, fontSize: 14, marginTop: 5 }}>
              {errors.carModel}
            </Text>
          )}

          {/* Model Autocomplete with proper positioning */}
          <AutocompleteContainer
            visible={showModelAutocomplete}
            suggestions={modelSuggestions}
            position={{ top: 0, left: 0, width: 0 }}
            onSelect={selectModel}
            type="model"
            isLoading={isLoadingModels}
          />
        </View>

        {/* Car Year Input */}
        {renderInput(
          "سنة الصنع",
          "مثال: 2021",
          formData.carYear,
          handleYearChange,
          errors.carYear,
          "numeric",
          yearInputRef,
          false,
          1,
          isValidatingYear
        )}

        {/* Mileage Input */}
        {renderInput(
          "الممشى (كم)",
          "مثال: 150000",
          formData.mileage,
          handleMileageChange,
          errors.mileage,
          "numeric",
          mileageInputRef
        )}

        {/* Problem Description Input */}
        {renderInput(
          "شرح العطل بالتفصيل",
          "اشرح المشكلة التي تواجهها مع السيارة...",
          formData.problemDescription,
          handleProblemChange,
          errors.problemDescription,
          "default",
          problemInputRef,
          true,
          4
        )}

        {/* Analyze Button */}
        <TouchableOpacity
          style={{
            backgroundColor: isAnalyzing || !isFormReady ? SUBTEXT : BTN,
            borderRadius: 8,
            padding: 18,
            alignItems: "center",
            marginTop: 20,
            opacity: isAnalyzing || !isFormReady ? 0.7 : 1,
          }}
          onPress={handleAnalyze}
          disabled={isAnalyzing || !isFormReady}
        >
          {isAnalyzing ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator
                color={TEXT}
                size="small"
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: TEXT, fontSize: 18, fontWeight: "600" }}>
                جاري التحليل...
              </Text>
            </View>
          ) : !isFormReady ? (
            <Text style={{ color: BTN_TEXT, fontSize: 18, fontWeight: "600" }}>
              أكمل جميع الحقول المطلوبة
            </Text>
          ) : (
            <Text style={{ color: BTN_TEXT, fontSize: 18, fontWeight: "600" }}>
              تحليل المشكلة
            </Text>
          )}
        </TouchableOpacity>

        {/* Loading indicator for initial load */}
        {isLoadingBrands && (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={{ color: SUBTEXT, marginTop: 10 }}>
              جاري تحميل أنواع السيارات...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
