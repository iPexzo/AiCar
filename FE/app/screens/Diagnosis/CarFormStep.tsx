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
  }, []);

  // Function to trigger all value animations sequentially
  const runSequentialShimmer = async () => {
    try {
      console.log("🚀 Starting sequential shimmer animations...");

      console.log("1️⃣ Starting Brand animation...");
      await brandAnimRef.current?.triggerAnimation();

      console.log("2️⃣ Starting Model animation...");
      await modelAnimRef.current?.triggerAnimation();

      console.log("3️⃣ Starting Year animation...");
      await yearAnimRef.current?.triggerAnimation();

      console.log("4️⃣ Starting Mileage animation...");
      await mileageAnimRef.current?.triggerAnimation();

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

    // Only show dropdown if user is actively typing
    if (brandInput && filtered.length > 0) {
      setBrandDropdown(true);
      Animated.parallel([
        Animated.timing(brandDropdownAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(brandFieldsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
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
    }

    // Smart match: if input matches a valid brand, auto-select
    const exact = allBrands.find(
      (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
    );
    if (exact && brandInput && carBrand !== exact) {
      setCarBrand(exact);
      setBrandInput(exact); // Keep the selected value in input
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        console.log("Fetched models for", carBrand, ":", models); // Debug log
        setAllModels(models.sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        setAllModels([]);
        console.log("Error fetching models for", carBrand, e);
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
    if (allModels.length === 0) {
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
      return;
    }

    // Only show dropdown if user is actively typing or focusing
    let filtered: string[] = [];
    if (!modelInput) {
      // Don't show all models automatically, only when user starts typing
      filtered = [];
    } else {
      filtered = allModels.filter((m) =>
        m.toLowerCase().startsWith(modelInput.toLowerCase())
      );
    }
    setModelOptions(filtered);

    // Only show dropdown if there are filtered results and user is typing
    if (filtered.length > 0 && modelInput) {
      setModelDropdown(true);
      Animated.parallel([
        Animated.timing(modelDropdownAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modelFieldsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelInput, allModels]);

  // Handle brand select (manual click)
  const handleBrandSelect = (brand: string) => {
    setCarBrand(brand);
    setBrandInput(brand); // Keep selected value in input
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
    setCarModel("");
    setModelInput("");
    setAllModels([]);
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
    Keyboard.dismiss();
    // Don't auto-focus on model field
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // If input matches a valid year, set carYear
    if (availableYears.includes(yearInput.trim())) {
      setCarYear(yearInput.trim());
    } else {
      setCarYear("");
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111",
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
        justifyContent: "center",
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
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          تفاصيل السيارة
        </Text>
        {/* --- Brand Input --- */}
        <AnimatedInputWrapper
          ref={brandAnimRef}
          onAnimationEnd={() => console.log("Brand animation completed")}
        >
          <View style={{ marginBottom: 8 }}>
            <TextInput
              placeholder="اختر ماركة السيارة"
              value={brandInput}
              onChangeText={setBrandInput}
              style={{
                backgroundColor: "#222",
                color: "#fff",
                borderRadius: 8,
                padding: 12,
                marginBottom: 0,
                borderWidth: 1,
                borderColor: brandDropdown ? "#3B82F6" : "#333",
              }}
              placeholderTextColor="#aaa"
              editable={true}
              onFocus={() => {
                // Show all brands when user focuses on the field
                if (allBrands.length > 0 && !brandDropdown) {
                  setBrandOptions(allBrands);
                  setBrandDropdown(true);
                  Animated.parallel([
                    Animated.timing(brandDropdownAnim, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }),
                    Animated.timing(brandFieldsAnim, {
                      toValue: 1,
                      duration: 350,
                      useNativeDriver: false,
                    }),
                  ]).start();
                }
              }}
              onBlur={() => {
                // Increased delay to prevent premature closing during selection
                setTimeout(() => {
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
                }, 300);
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
            {brandDropdown && brandOptions.length > 0 && (
              <View
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  maxHeight: 160,
                  borderWidth: 1,
                  borderColor: "#333",
                  marginTop: 4,
                }}
              >
                <FlatList
                  data={brandOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setCarBrand(item);
                        setBrandInput(item); // Show selected brand in input field
                        setModelInput("");
                        setCarModel("");
                        setYearInput("");
                        setCarYear("");
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
        </AnimatedInputWrapper>
        {/* --- Model Input --- */}
        <AnimatedInputWrapper
          ref={modelAnimRef}
          onAnimationEnd={() => console.log("Model animation completed")}
        >
          <Animated.View
            style={{
              marginBottom: 8,
              transform: [
                {
                  translateY: brandFieldsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                },
              ],
            }}
          >
            <TextInput
              ref={modelRef}
              placeholder="اختر موديل السيارة"
              value={modelInput}
              onChangeText={setModelInput}
              style={{
                backgroundColor: "#222",
                color: "#fff",
                borderRadius: 8,
                padding: 12,
                marginBottom: 0,
                borderWidth: 1,
                borderColor: modelDropdown ? "#3B82F6" : "#333",
              }}
              placeholderTextColor="#aaa"
              editable={!!carBrand}
              onFocus={() => {
                // Show all models when user focuses on the field
                if (allModels.length > 0 && !modelDropdown) {
                  setModelOptions(allModels);
                  setModelDropdown(true);
                  Animated.parallel([
                    Animated.timing(modelDropdownAnim, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }),
                    Animated.timing(modelFieldsAnim, {
                      toValue: 1,
                      duration: 350,
                      useNativeDriver: false,
                    }),
                  ]).start();
                }
              }}
              onBlur={() => {
                // Increased delay to prevent premature closing during selection
                setTimeout(() => {
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
                }, 300);
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
            {modelDropdown && modelOptions.length > 0 && (
              <View
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  maxHeight: 160,
                  borderWidth: 1,
                  borderColor: "#333",
                  marginTop: 4,
                }}
              >
                <FlatList
                  data={modelOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setCarModel(item);
                        setModelInput(item); // Show selected model in input field
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
            {/* Remove automatic error message - only show on submit */}
          </Animated.View>
        </AnimatedInputWrapper>
        {/* --- Year Input --- */}
        <AnimatedInputWrapper
          ref={yearAnimRef}
          onAnimationEnd={() => console.log("Year animation completed")}
        >
          <Animated.View
            style={{
              marginBottom: 8,
              transform: [
                {
                  translateY: Animated.add(
                    brandFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 40],
                    }),
                    modelFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 25],
                    })
                  ),
                },
              ],
            }}
          >
            <TextInput
              ref={yearRef}
              placeholder="مثال: 2019"
              value={yearInput}
              onChangeText={(text) => {
                setYearInput(text);
                // Only set carYear if the text is a valid year from allYears
                if (allYears.includes(text.trim())) {
                  setCarYear(text.trim());
                } else {
                  setCarYear("");
                }
              }}
              style={{
                backgroundColor: "#222",
                color: "#fff",
                borderRadius: 8,
                padding: 12,
                marginBottom: 0,
                borderWidth: 1,
                borderColor: yearDropdown ? "#3B82F6" : "#333",
              }}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              onFocus={() => {
                // Show year dropdown only when user focuses on the field
                if (allYears.length > 0 && !yearDropdown) {
                  setYearOptions(allYears);
                  setYearDropdown(true);
                  Animated.parallel([
                    Animated.timing(yearDropdownAnim, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }),
                    Animated.timing(yearFieldsAnim, {
                      toValue: 1,
                      duration: 350,
                      useNativeDriver: false,
                    }),
                  ]).start();
                }
              }}
              onBlur={() => {
                // Extended delay to prevent premature closing during selection on mobile
                setTimeout(() => {
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
                }, 400);
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
            {yearDropdown && yearOptions.length > 0 && (
              <View
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  maxHeight: 160,
                  borderWidth: 1,
                  borderColor: "#333",
                  marginTop: 4,
                }}
              >
                <FlatList
                  data={yearOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setCarYear(item);
                        setYearInput(item); // Show selected year in input field
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
                        Keyboard.dismiss();
                        // Ensure the value is properly saved
                        console.log(
                          "Year selected:",
                          item,
                          "carYear set to:",
                          item
                        );
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
        </AnimatedInputWrapper>
        <AnimatedInputWrapper
          ref={mileageAnimRef}
          onAnimationEnd={() => console.log("Mileage animation completed")}
        >
          <Animated.View
            style={{
              marginBottom: 8,
              transform: [
                {
                  translateY: Animated.add(
                    Animated.add(
                      brandFieldsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 40],
                      }),
                      modelFieldsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 25],
                      })
                    ),
                    yearFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 40],
                    })
                  ),
                },
              ],
            }}
          >
            <TextInput
              ref={mileageRef}
              placeholder="مثال: 120000"
              value={mileage}
              onChangeText={setMileage}
              style={{
                backgroundColor: "#222",
                color: "#fff",
                borderRadius: 8,
                padding: 12,
                marginBottom: 0,
              }}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              onSubmitEditing={() => {
                // Optionally focus the next field (problemDescription) if you want
              }}
              returnKeyType="next"
            />
          </Animated.View>
        </AnimatedInputWrapper>
        <Animated.View
          style={{
            transform: [
              {
                translateY: Animated.add(
                  Animated.add(
                    brandFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 40],
                    }),
                    modelFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 25],
                    })
                  ),
                  yearFieldsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  })
                ),
              },
            ],
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            اشرح العطلة بالتفصيل
          </Text>
          <AnimatedInputWrapper
            ref={problemAnimRef}
            onAnimationEnd={() => console.log("Problem animation completed")}
          >
            <TextInput
              placeholder="اكتب وصفاً مفصلاً للمشكلة التي تواجهها مع السيارة..."
              value={problemDescription}
              onChangeText={setProblemDescription}
              style={{
                backgroundColor: "#222",
                color: "#fff",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                minHeight: 80,
              }}
              placeholderTextColor="#aaa"
              multiline
            />
          </AnimatedInputWrapper>
        </Animated.View>
        <Animated.View
          style={{
            transform: [
              {
                translateY: Animated.add(
                  Animated.add(
                    brandFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 40],
                    }),
                    modelFieldsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 25],
                    })
                  ),
                  yearFieldsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  })
                ),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#3B82F6",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 12,
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
          </TouchableOpacity>
          {error ? (
            <Text style={{ color: "#f44", marginTop: 8 }}>{error}</Text>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
};

export default CarFormStep;
