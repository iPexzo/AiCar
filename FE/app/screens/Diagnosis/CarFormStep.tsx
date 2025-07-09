import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Animated,
} from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import AnimatedInputWrapper from "./AnimatedInputWrapper";

interface CarFormStepProps {
  onSubmit: (formData: any) => void;
}

// Curated list of only the most famous/popular car brands
const POPULAR_BRANDS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "Hyundai",
  "Kia",
  "Mazda",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Jeep",
  "GMC",
  "Dodge",
  "Subaru",
  "Tesla",
  "Infiniti",
  "Cadillac",
  "Land Rover",
  "Jaguar",
  "Porsche",
  "Mini",
  "Fiat",
  "Suzuki",
  "Peugeot",
  "Renault",
  "Mitsubishi",
  "Chrysler",
  "Buick",
  "Lincoln",
  "Volvo",
  "Acura",
  "Genesis",
  "Isuzu",
  "Hummer",
  "Opel",
  "Seat",
  "Skoda",
  "Saab",
  "Citroen",
  "Alfa Romeo",
  "Bentley",
  "Ferrari",
  "Maserati",
  "Rolls-Royce",
  "Aston Martin",
  "McLaren",
];

const CarFormStep: React.FC<CarFormStepProps> = ({ onSubmit }) => {
  // Form state
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shimmerLoading, setShimmerLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation refs for form values
  const brandAnimRef = useRef<any>(null);
  const modelAnimRef = useRef<any>(null);
  const yearAnimRef = useRef<any>(null);
  const mileageAnimRef = useRef<any>(null);
  const problemAnimRef = useRef<any>(null);

  // Brand autocomplete state
  const [brandInput, setBrandInput] = useState("");
  const [brandDropdown, setBrandDropdown] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const brandDropdownAnim = useRef(new Animated.Value(0)).current;
  const brandFieldsAnim = useRef(new Animated.Value(0)).current;

  // Model autocomplete state
  const [modelInput, setModelInput] = useState("");
  const [modelDropdown, setModelDropdown] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]);
  const modelDropdownAnim = useRef(new Animated.Value(0)).current;
  const modelFieldsAnim = useRef(new Animated.Value(0)).current;

  // Add refs for year, model, and mileage inputs
  const yearRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const mileageRef = useRef<TextInput>(null);

  // --- Year Dropdown State ---
  const [yearInput, setYearInput] = useState("");
  const [yearDropdown, setYearDropdown] = useState(false);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [yearLoading, setYearLoading] = useState(false);
  const yearDropdownAnim = useRef(new Animated.Value(0)).current;
  const yearFieldsAnim = useRef(new Animated.Value(0)).current;

  // --- Mileage Dropdown State ---
  const mileageDropdownAnim = useRef(new Animated.Value(0)).current;
  const mileageFieldsAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation refs
  const pageEntranceAnim = useRef(new Animated.Value(0)).current;
  const submitButtonAnim = useRef(new Animated.Value(1)).current;

  // Generate years from 1980 to current year
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1980; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const allYears = generateYears();

  // Always use the curated list for allBrands
  useEffect(() => {
    setAllBrands(POPULAR_BRANDS);
    console.log("allBrands", POPULAR_BRANDS);
  }, []);

  // Page entrance animation
  useEffect(() => {
    Animated.timing(pageEntranceAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Function to trigger all value animations sequentially
  const runSequentialShimmer = async () => {
    try {
      console.log("🚀 Starting sequential shimmer animations...");

      console.log("1️⃣ Starting Brand animation...");
      await brandAnimRef.current?.triggerAnimation();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between fields

      console.log("2️⃣ Starting Model animation...");
      await modelAnimRef.current?.triggerAnimation();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between fields

      console.log("3️⃣ Starting Year animation...");
      await yearAnimRef.current?.triggerAnimation();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between fields

      console.log("4️⃣ Starting Mileage animation...");
      await mileageAnimRef.current?.triggerAnimation();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between fields

      console.log("5️⃣ Starting Problem animation...");
      await problemAnimRef.current?.triggerAnimation();

      console.log("✅ All shimmer animations completed!");
    } catch (error) {
      console.log("❌ Shimmer animation error:", error);
    }
  };

  // Legacy function for backward compatibility
  const triggerValueAnimations = () => {
    runSequentialShimmer();
  };

  // --- Brand Input Filtering and Dropdown Logic ---
  useEffect(() => {
    const filtered = allBrands.filter((b) =>
      b.toLowerCase().startsWith(brandInput.toLowerCase())
    );
    setBrandOptions(filtered);

    if (brandInput && filtered.length > 0) {
      setBrandDropdown(true);
    } else {
      setBrandDropdown(false);
    }
  }, [brandInput, allBrands]);

  // --- Brand Input Enter Key Handling ---
  const handleBrandEnter = () => {
    const exact = allBrands.find(
      (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
    );
    if (exact) {
      setCarBrand(exact);
      setBrandInput("");
      setBrandDropdown(false);
      Animated.parallel([
        Animated.timing(brandDropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(brandFieldsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      modelRef.current?.focus();
    }
  };

  // عند تغيير carBrand، اجلب الموديلات من endpoint الصحيح (بدون السنة)
  useEffect(() => {
    if (!carBrand) {
      setAllModels([]);
      setModelInput("");
      setCarModel("");
      setModelOptions([]);
      setModelDropdown(false);
      Animated.parallel([
        Animated.timing(modelDropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modelFieldsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      setAvailableYears([]);
      setYearInput("");
      setYearOptions([]);
      setYearDropdown(false);
      return;
    }
    async function fetchModels() {
      try {
        const res = await axios.get(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
            carBrand
          )}?format=json`
        );
        const models = Array.from(
          new Set(res.data.Results.map((item: any) => item.Model_Name))
        ).filter((m): m is string => typeof m === "string");
        setAllModels(models.sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        setAllModels([]);
      }
    }
    setModelInput("");
    setCarModel("");
    setModelOptions([]);
    setModelDropdown(false);
    Animated.parallel([
      Animated.timing(modelDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modelFieldsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    setAvailableYears([]);
    setYearInput("");
    setYearOptions([]);
    setYearDropdown(false);
    fetchModels();
  }, [carBrand]);

  // --- عند اختيار موديل، جلب السنوات المتاحة بدون فتح القائمة تلقائياً ---
  useEffect(() => {
    if (carBrand && carModel) {
      fetchAvailableYears(carBrand, carModel);
      // Don't automatically show year dropdown
      setYearDropdown(false);
      Animated.parallel([
        Animated.timing(yearDropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(yearFieldsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      setAvailableYears([]);
      setYearInput("");
      setYearOptions([]);
      setYearDropdown(false);
      Animated.parallel([
        Animated.timing(yearDropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(yearFieldsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [carBrand, carModel]);

  // --- Model Input Filtering and Dropdown Logic ---
  useEffect(() => {
    let filtered: string[] = [];
    if (!modelInput) {
      filtered = [];
    } else {
      filtered = allModels.filter((m) =>
        m.toLowerCase().startsWith(modelInput.toLowerCase())
      );
    }
    setModelOptions(filtered);

    if (filtered.length > 0 && modelInput) {
      setModelDropdown(true);
    } else {
      setModelDropdown(false);
    }

    // Smart match: if input matches a valid model, auto-select
    const exact = allModels.find(
      (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
    );
    if (exact && modelInput && carModel !== exact) {
      setCarModel(exact);
      setModelInput(exact); // Keep the selected value in the input
      setModelDropdown(false);
      Animated.parallel([
        Animated.timing(modelDropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modelFieldsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      yearRef.current?.focus();
    }
  }, [modelInput, allModels]);

  // عند اختيار عنصر من القائمة فقط يتم تعيين القيمة النهائية:
  const handleBrandSelect = (brand: string) => {
    setCarBrand(brand);
    setBrandInput(brand);
    setBrandDropdown(false);
    setCarModel("");
    setModelInput("");
    setAllModels([]);
    setModelOptions([]);
    setModelDropdown(false);
    Keyboard.dismiss();
  };

  // Handle model select (manual click)
  const handleModelSelect = (model: string) => {
    setCarModel(model);
    setModelInput(model); // Keep selected value in input
    setModelDropdown(false);
    Keyboard.dismiss();
    // Don't auto-focus on year field
  };

  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: any) => {
      const formData = new FormData();
      formData.append("image", file);
      return (await axios.post("/api/upload", formData)).data;
    },
    onSuccess: (data) => {
      setImage(data.url);
    },
  });

  // --- Fetch available years for selected make/model ---
  const fetchAvailableYears = async (make: string, model: string) => {
    const foundYears: string[] = [];
    const requests = [];
    for (let year = 1980; year <= 2025; year++) {
      requests.push(
        axios
          .get(
            `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
              make
            )}/modelyear/${year}?format=json`
          )
          .then((res) => {
            const models = res.data.Results.map((r: any) =>
              r.Model_Name.toLowerCase()
            );
            if (models.includes(model.toLowerCase())) {
              foundYears.push(year.toString());
            }
          })
          .catch(() => {})
      );
    }
    await Promise.all(requests);
    foundYears.sort((a, b) => parseInt(b) - parseInt(a)); // Descending
    setAvailableYears(foundYears);
  };

  // --- Trigger fetch when user types in year after brand/model are selected ---
  useEffect(() => {
    if (
      carBrand &&
      carModel &&
      yearInput.length > 0 &&
      availableYears.length === 0 &&
      !yearLoading
    ) {
      fetchAvailableYears(carBrand, carModel);
    }
  }, [carBrand, carModel, yearInput]);

  // --- Year Input Filtering and Dropdown Logic ---
  useEffect(() => {
    if (!yearInput || availableYears.length === 0) {
      setYearOptions([]);
      setYearDropdown(false);
      return;
    }
    const filtered = availableYears.filter((y) => y.startsWith(yearInput));
    setYearOptions(filtered);
    if (filtered.length > 0 && yearInput) {
      setYearDropdown(true);
    } else {
      setYearDropdown(false);
    }
  }, [yearInput, availableYears]);

  // Add validation effect to ensure all values are properly set
  useEffect(() => {
    // Validate that selected values are properly stored
    if (carBrand && !brandInput) {
      setBrandInput(carBrand);
    }
    if (carModel && !modelInput) {
      setModelInput(carModel);
    }
    if (carYear && !yearInput) {
      setYearInput(carYear);
    }
  }, [carBrand, carModel, carYear, brandInput, modelInput, yearInput]);

  // Debug effect to log form state changes
  useEffect(() => {
    console.log("Form state updated:", {
      carBrand,
      carModel,
      carYear,
      brandInput,
      modelInput,
      yearInput,
      mileage,
      problemDescription,
    });
  }, [
    carBrand,
    carModel,
    carYear,
    brandInput,
    modelInput,
    yearInput,
    mileage,
    problemDescription,
  ]);

  const handleSubmit = () => {
    setError("");

    // Enhanced validation with proper value checking
    const formValues = {
      carBrand: carBrand || brandInput,
      carModel: carModel || modelInput,
      carYear: carYear || yearInput,
      mileage,
      problemDescription,
    };

    if (
      !formValues.carBrand ||
      !formValues.carModel ||
      !formValues.carYear ||
      !mileage ||
      !problemDescription
    ) {
      setError("جميع الحقول مطلوبة");
      console.log("Form validation failed:", formValues); // Debug log
      console.log("Year validation details:", {
        carYear: formValues.carYear,
        yearInput: yearInput,
        allYears: allYears.slice(0, 5), // Show first 5 years for debugging
        isValidYear: allYears.includes(formValues.carYear),
      });
      return;
    }

    // Ensure final values are set
    if (formValues.carBrand !== carBrand) setCarBrand(formValues.carBrand);
    if (formValues.carModel !== carModel) setCarModel(formValues.carModel);
    if (formValues.carYear !== carYear) setCarYear(formValues.carYear);

    setShimmerLoading(true);

    // Button bounce animation
    Animated.sequence([
      Animated.timing(submitButtonAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(submitButtonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Run sequential shimmer animations
    runSequentialShimmer().then(() => {
      setShimmerLoading(false);
      setLoading(true);

      onSubmit({
        carBrand: formValues.carBrand,
        carModel: formValues.carModel,
        carYear: formValues.carYear,
        mileage,
        problemDescription,
        image,
      });

      setLoading(false);
    });
  };

  // --- Focused states for each input ---
  const [brandFocused, setBrandFocused] = useState(false);
  const [modelFocused, setModelFocused] = useState(false);
  const [yearFocused, setYearFocused] = useState(false);
  const [mileageFocused, setMileageFocused] = useState(false);
  const [problemFocused, setProblemFocused] = useState(false);

  // Add state for mileage position animation
  const ITEM_HEIGHT = 40;
  const MAX_DROPDOWN_HEIGHT = 160;

  // Calculate dropdown height dynamically for year dropdown
  const dropdownHeight = Math.min(
    yearOptions.length * ITEM_HEIGHT,
    MAX_DROPDOWN_HEIGHT
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: "#111",
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
        justifyContent: "center",
        opacity: pageEntranceAnim,
        transform: [
          {
            translateY: pageEntranceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      }}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          تحليل مشاكل السيارة
        </Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          تفاصيل السيارة
        </Text>
        {/* --- Brand Input --- */}
        <View style={{ marginBottom: 24 }}>
          <Animated.View
            style={{
              transform: [], // لا يوجد إزاحة للماركة
            }}
          >
            <AnimatedInputWrapper
              ref={brandAnimRef}
              height={50}
              onAnimationEnd={() => console.log("Brand animation completed")}
              style={{
                borderWidth: 1,
                borderColor: brandFocused ? "#2563eb" : "transparent",
                borderRadius: 12,
                backgroundColor: "transparent",
                borderBottomWidth: brandDropdown ? 0 : 1,
                borderBottomLeftRadius: brandDropdown ? 0 : 12,
                borderBottomRightRadius: brandDropdown ? 0 : 12,
                position: "relative",
                zIndex: 11,
              }}
            >
              <TextInput
                placeholder="اختر ماركة السيارة"
                value={brandInput}
                onChangeText={(text) => {
                  setBrandInput(text);
                  if (text === "") {
                    setCarBrand(""); // Clear selection if input is cleared
                  }
                  const filtered = allBrands.filter((b) =>
                    b.toLowerCase().startsWith(text.toLowerCase())
                  );
                  setBrandOptions(filtered);
                  setBrandDropdown(true);
                  console.log("onChangeText", text, filtered);
                }}
                style={{
                  backgroundColor: brandFocused
                    ? "rgba(59,130,246,0.08)"
                    : "#111",
                  color: "#fff",
                  borderRadius: 12,
                  borderWidth: 0, // Remove border from input
                  borderColor: brandFocused ? "#fff" : "transparent",
                  padding: 10,
                  fontSize: 15,
                  marginBottom: 4,
                  textAlign: "right",
                  minHeight: 40,
                }}
                placeholderTextColor="#aaa"
                editable={true}
                onFocus={() => {
                  setBrandFocused(true);
                  if (allBrands.length > 0) {
                    setBrandOptions(allBrands);
                    setBrandDropdown(true);
                    console.log("onFocus", brandDropdown, brandOptions);
                  }
                }}
                onBlur={() => {
                  setBrandFocused(false);
                  setTimeout(() => setBrandDropdown(false), 200);
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === "Enter" ||
                    nativeEvent.key === "Return"
                  ) {
                    const exact = allBrands.find(
                      (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
                    );
                    if (exact) {
                      setCarBrand(exact);
                      setBrandDropdown(false);
                      Animated.parallel([
                        Animated.timing(brandDropdownAnim, {
                          toValue: 0,
                          duration: 200,
                          useNativeDriver: true,
                        }),
                        Animated.timing(brandFieldsAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: false,
                        }),
                      ]).start();
                      // Don't auto-focus on model field
                    }
                  }
                }}
                onSubmitEditing={() => {
                  const exact = allBrands.find(
                    (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
                  );
                  if (exact) {
                    setCarBrand(exact);
                    setBrandDropdown(false);
                    Animated.parallel([
                      Animated.timing(brandDropdownAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                      Animated.timing(brandFieldsAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                    ]).start();
                    // Don't auto-focus on model field
                  }
                }}
                returnKeyType="next"
              />
            </AnimatedInputWrapper>
            {/* Move dropdown outside of AnimatedInputWrapper to avoid overflow clipping */}
            {brandDropdown && (
              <View
                style={{
                  marginTop: 0,
                  width: "100%",
                  maxHeight: 160,
                  backgroundColor: "#222",
                  borderWidth: 1,
                  borderColor: brandFocused ? "#2563eb" : "transparent",
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  overflow: "visible",
                  zIndex: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <FlatList
                  data={brandOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setBrandDropdown(false); // Close dropdown first
                        setCarBrand(item);
                        setBrandInput(item);
                        Keyboard.dismiss();
                      }}
                      style={{ padding: 12, backgroundColor: "#333" }}
                    >
                      <Text style={{ color: "#fff" }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </Animated.View>
        </View>
        {/* --- Model Input --- */}
        <View style={{ marginBottom: 24, position: "relative" }}>
          <AnimatedInputWrapper
            ref={modelAnimRef}
            height={50}
            onAnimationEnd={() => console.log("Model animation completed")}
            style={{
              borderWidth: 0, // Remove border from input
              borderTopWidth: modelFocused ? 2 : 1,
              borderTopColor: modelFocused ? "#2563eb" : "transparent",
              borderRadius: 12,
              backgroundColor: "transparent",
            }}
          >
            <TextInput
              placeholder="اختر موديل السيارة"
              value={modelInput}
              onChangeText={(text) => {
                setModelInput(text);
                if (text === "") {
                  setCarModel("");
                }
                const filtered = allModels.filter((m) =>
                  m.toLowerCase().startsWith(text.toLowerCase())
                );
                setModelOptions(filtered);
                setModelDropdown(true);
              }}
              style={{
                backgroundColor: modelFocused
                  ? "rgba(59,130,246,0.08)"
                  : "#111",
                color: "#fff",
                borderRadius: 12,
                borderWidth: 0, // Remove border from input
                borderColor: modelFocused ? "#fff" : "transparent",
                padding: 10,
                fontSize: 15,
                marginBottom: 4,
                textAlign: "right",
                minHeight: 40,
              }}
              placeholderTextColor="#aaa"
              editable={!!carBrand}
              onFocus={() => {
                setModelFocused(true);
                if (allModels.length > 0) {
                  setModelOptions(allModels);
                  setModelDropdown(true);
                }
                // Always show dropdown on focus if there are models, even if modelInput is empty
                if (allModels.length > 0 && modelInput === "") {
                  setModelDropdown(true);
                }
              }}
              onBlur={() => {
                setModelFocused(false);
                setTimeout(() => setModelDropdown(false), 200);
              }}
              onKeyPress={({ nativeEvent }) => {
                if (
                  nativeEvent.key === "Enter" ||
                  nativeEvent.key === "Return"
                ) {
                  const exact = allModels.find(
                    (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
                  );
                  if (exact) {
                    if (carModel !== exact) {
                      setCarModel(exact);
                    }
                    setModelInput(exact); // Show selected model in input field
                    setYearInput("");
                    setCarYear("");
                    setModelDropdown(false);
                    Animated.parallel([
                      Animated.timing(modelDropdownAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                      Animated.timing(modelFieldsAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                    ]).start();
                    // Don't auto-focus on year field
                  }
                }
              }}
              onSubmitEditing={() => {
                const exact = allModels.find(
                  (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
                );
                if (exact) {
                  if (carModel !== exact) {
                    setCarModel(exact);
                  }
                  setModelInput(exact); // Show selected model in input field
                  setYearInput("");
                  setCarYear("");
                  setModelDropdown(false);
                  Animated.parallel([
                    Animated.timing(modelDropdownAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(modelFieldsAnim, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }),
                  ]).start();
                  // Don't auto-focus on year field
                }
              }}
              returnKeyType="next"
            />
          </AnimatedInputWrapper>
          {/* Move model dropdown outside of AnimatedInputWrapper to avoid overflow clipping */}
          {modelDropdown && (
            <View
              style={{
                marginTop: 0,
                width: "100%",
                maxHeight: 160,
                backgroundColor: "#222",
                borderRadius: 8,
                borderWidth: 0,
                borderTopWidth: 0,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderColor: modelFocused ? "#2563eb" : "transparent",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              <FlatList
                data={modelOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setModelDropdown(false);
                      setCarModel(item);
                      setModelInput(item);
                      Keyboard.dismiss();
                    }}
                    style={{ padding: 12, backgroundColor: "#333" }}
                  >
                    <Text style={{ color: "#fff" }}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
        </View>
        {/* --- Year Input --- */}
        <View style={{ marginBottom: 24, position: "relative" }}>
          <AnimatedInputWrapper
            ref={yearAnimRef}
            height={50}
            onAnimationEnd={() => console.log("Year animation completed")}
            style={{
              borderWidth: 1,
              borderColor: yearFocused ? "#2563eb" : "transparent",
              borderRadius: 12,
              backgroundColor: "transparent",
              borderBottomWidth: yearDropdown && yearOptions.length > 0 ? 0 : 1,
              borderBottomLeftRadius:
                yearDropdown && yearOptions.length > 0 ? 0 : 12,
              borderBottomRightRadius:
                yearDropdown && yearOptions.length > 0 ? 0 : 12,
              position: "relative",
              zIndex: 11,
            }}
          >
            <TextInput
              ref={yearRef}
              placeholder="مثال: 2019"
              value={yearInput}
              onChangeText={(text) => {
                let sanitized = text.replace(/[^0-9]/g, "").slice(0, 4);
                // Block impossible prefixes
                if (sanitized.length === 1) {
                  if (sanitized !== "1" && sanitized !== "2") sanitized = "";
                } else if (sanitized.length === 2) {
                  if (sanitized[0] === "1" && sanitized[1] !== "9")
                    sanitized = sanitized[0];
                  if (sanitized[0] === "2" && sanitized[1] !== "0")
                    sanitized = sanitized[0];
                } else if (sanitized.length === 3) {
                  if (sanitized.startsWith("19")) {
                    if (parseInt(sanitized, 10) < 197)
                      sanitized = sanitized.slice(0, 2);
                  } else if (sanitized.startsWith("20")) {
                    if (parseInt(sanitized, 10) > 202)
                      sanitized = sanitized.slice(0, 2);
                  } else {
                    sanitized = sanitized.slice(0, 2);
                  }
                } else if (sanitized.length === 4) {
                  const yearNum = parseInt(sanitized, 10);
                  if (yearNum < 1970 || yearNum > 2025)
                    sanitized = sanitized.slice(0, 3);
                }
                setYearInput(sanitized);
                // Only set carYear if 4 digits and in range
                if (sanitized.length === 4) {
                  const yearNum = parseInt(sanitized, 10);
                  if (yearNum >= 1970 && yearNum <= 2025) {
                    setCarYear(sanitized);
                  } else {
                    setCarYear("");
                  }
                } else {
                  setCarYear("");
                }
                // Update yearOptions for dropdown
                if (sanitized.length === 0) {
                  setYearOptions(
                    Array.from({ length: 2025 - 1970 + 1 }, (_, i) =>
                      (2025 - i).toString()
                    )
                  );
                  setYearDropdown(true);
                } else {
                  const filtered = Array.from(
                    { length: 2025 - 1970 + 1 },
                    (_, i) => (2025 - i).toString()
                  ).filter((y) => y.startsWith(sanitized));
                  setYearOptions(filtered);
                  setYearDropdown(filtered.length > 0);
                }
              }}
              style={{
                backgroundColor: yearFocused ? "rgba(59,130,246,0.08)" : "#111",
                color: "#fff",
                borderRadius: 12,
                borderWidth: 0, // Remove border from input
                borderColor: yearFocused ? "#fff" : "transparent",
                padding: 10,
                fontSize: 15,
                marginBottom: 4,
                textAlign: "right",
                minHeight: 40,
              }}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              onFocus={() => {
                setYearFocused(true);
                if (!carBrand || !carModel) return;
                setYearOptions(availableYears);
                setYearDropdown(availableYears.length > 0);
              }}
              onBlur={() => {
                setYearFocused(false);
                setTimeout(() => setYearDropdown(false), 150);
              }}
              onKeyPress={({ nativeEvent }) => {
                if (
                  nativeEvent.key === "Enter" ||
                  nativeEvent.key === "Return"
                ) {
                  const exact = allYears.find((y) => y === yearInput.trim());
                  if (exact) {
                    setCarYear(exact);
                    setYearInput(exact); // Show selected year in input field
                    setYearDropdown(false);
                    Animated.parallel([
                      Animated.timing(yearDropdownAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                      Animated.timing(yearFieldsAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                    ]).start();
                    // Don't auto-focus on mileage field
                  }
                }
              }}
              onSubmitEditing={() => {
                const exact = allYears.find((y) => y === yearInput.trim());
                if (exact) {
                  setCarYear(exact);
                  setYearInput(exact); // Show selected year in input field
                  setYearDropdown(false);
                  Animated.parallel([
                    Animated.timing(yearDropdownAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(yearFieldsAnim, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }),
                  ]).start();
                  // Don't auto-focus on mileage field
                }
              }}
              returnKeyType="next"
            />
            {yearLoading && (
              <View style={{ position: "absolute", right: 16, top: 12 }}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            {/* --- Year Dropdown: render inline, borderTopWidth: 0, only one border --- */}
            {yearDropdown && yearOptions.length > 0 && (
              <View
                style={{
                  marginTop: 0,
                  width: "100%",
                  maxHeight: MAX_DROPDOWN_HEIGHT,
                  height: dropdownHeight,
                  backgroundColor: "#222",
                  borderRadius: 8,
                  borderWidth: 0,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderColor: yearFocused ? "#2563eb" : "transparent",
                  overflow: "hidden",
                  zIndex: 1,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <FlatList
                  data={yearOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setYearDropdown(false);
                        setCarYear(item);
                        setYearInput(item);
                        Keyboard.dismiss();
                      }}
                      style={{
                        padding: 12,
                        backgroundColor: "#333",
                        height: ITEM_HEIGHT,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#fff" }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0 }}
                />
              </View>
            )}
          </AnimatedInputWrapper>
        </View>
        {/* --- Mileage Input --- */}
        <View
          style={{
            position: "relative",
            zIndex: 10, // Ensure it's above the dropdown
          }}
        >
          <AnimatedInputWrapper
            ref={mileageAnimRef}
            height={50}
            onAnimationEnd={() => console.log("Mileage animation completed")}
            style={{
              borderWidth: 1,
              borderColor: mileageFocused ? "#2563eb" : "transparent",
              borderRadius: 12,
              backgroundColor: "transparent",
              borderTopWidth: mileageFocused ? 2 : 1,
              borderTopColor: mileageFocused ? "#2563eb" : "transparent",
            }}
          >
            <TextInput
              ref={mileageRef}
              placeholder="ممشى السيارة مثال: 120000"
              value={mileage}
              onChangeText={(text) => {
                // Remove any non-digit characters
                const sanitized = text.replace(/[^0-9]/g, "");
                setMileage(sanitized);
              }}
              style={{
                borderWidth: 0,
                borderRadius: 12,
                backgroundColor: mileageFocused
                  ? "rgba(59,130,246,0.08)"
                  : "#111",
                color: "#fff",
                padding: 10,
                fontSize: 15,
                minHeight: 40,
                textAlign: "right",
              }}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              onFocus={() => setMileageFocused(true)}
              onBlur={() => setMileageFocused(false)}
              onSubmitEditing={() => {
                // Optionally focus the next field (problemDescription) if you want
              }}
              returnKeyType="next"
            />
          </AnimatedInputWrapper>
        </View>
        {/* --- Problem Description --- */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            اشرح العطل بالتفصيل
          </Text>
          {/* --- Problem Description Input: Fix double border --- */}
          <AnimatedInputWrapper
            ref={problemAnimRef}
            height={60}
            onAnimationEnd={() => console.log("Problem animation completed")}
            style={{
              borderWidth: 0, // Remove border from input
              borderTopWidth: problemFocused ? 2 : 1,
              borderTopColor: problemFocused ? "#2563eb" : "transparent",
              borderRadius: 12,
              backgroundColor: "transparent",
            }}
          >
            <TextInput
              value={problemDescription}
              onChangeText={setProblemDescription}
              style={{
                backgroundColor: problemFocused
                  ? "rgba(59,130,246,0.08)"
                  : "#111",
                color: "#fff",
                borderWidth: 0, // No border on input itself
                borderRadius: 12,
                padding: 10,
                fontSize: 15,
                minHeight: 40,
                textAlign: "right",
              }}
              placeholderTextColor="#aaa"
              multiline
              onFocus={() => setProblemFocused(true)}
              onBlur={() => setProblemFocused(false)}
            />
          </AnimatedInputWrapper>
        </View>
        <Animated.View
          style={{
            transform: [{ scale: submitButtonAnim }],
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#3B82F6",
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              marginTop: 12,
              marginBottom: 12,
            }}
            disabled={loading || shimmerLoading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : shimmerLoading ? (
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                جاري التحليل...
              </Text>
            ) : (
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                تحليل المشكلة
              </Text>
            )}
            {error ? (
              <Text style={{ color: "#f44", marginTop: 8 }}>{error}</Text>
            ) : null}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export default CarFormStep;
