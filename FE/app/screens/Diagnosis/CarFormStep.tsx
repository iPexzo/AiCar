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
  const [error, setError] = useState("");

  // Brand autocomplete state
  const [brandInput, setBrandInput] = useState("");
  const [brandDropdown, setBrandDropdown] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const brandDropdownAnim = useRef(new Animated.Value(0)).current;
  let brandDebounceTimeout: NodeJS.Timeout | null = null;

  // Model autocomplete state
  const [modelInput, setModelInput] = useState("");
  const [modelDropdown, setModelDropdown] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]);
  const modelDropdownAnim = useRef(new Animated.Value(0)).current;

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
  // Cache for available years per make/model
  const yearsCache = useRef<{ [key: string]: string[] }>({});

  // Always use the curated list for allBrands
  useEffect(() => {
    setAllBrands(POPULAR_BRANDS);
  }, []);

  // --- Brand Input Filtering and Dropdown Logic ---
  useEffect(() => {
    // Debug logs
    // (You can remove these if not needed)
    // console.log("brandInput:", brandInput);
    // console.log("allBrands:", allBrands);
    const filtered = allBrands.filter((b) =>
      b.toLowerCase().startsWith(brandInput.toLowerCase())
    );
    // console.log("brandOptions:", filtered);
    setBrandOptions(filtered);
    if (brandInput && filtered.length > 0) {
      setBrandDropdown(true);
      Animated.timing(brandDropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setBrandDropdown(false);
      Animated.timing(brandDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // Smart match: if input matches a valid brand after 400ms, auto-select
    // Do NOT clear the input after selection; keep the value visible
    const exact = allBrands.find(
      (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
    );
    if (exact && brandInput && carBrand !== exact) {
      setCarBrand(exact);
      // Do NOT clear brandInput here
      setBrandDropdown(false);
      Animated.timing(brandDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      modelRef.current?.focus();
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
      Animated.timing(brandDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
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
    setAvailableYears([]);
    setYearInput("");
    setYearOptions([]);
    setYearDropdown(false);
    fetchModels();
  }, [carBrand]);

  // --- عند اختيار موديل، فعّل حقل السنة وجلب السنوات المتاحة ---
  useEffect(() => {
    if (carBrand && carModel) {
      fetchAvailableYears(carBrand, carModel);
    } else {
      setAvailableYears([]);
      setYearInput("");
      setYearOptions([]);
      setYearDropdown(false);
    }
  }, [carBrand, carModel]);

  // --- Model Input Filtering and Dropdown Logic ---
  useEffect(() => {
    if (allModels.length === 0) {
      setModelOptions([]);
      setModelDropdown(false);
      Animated.timing(modelDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }
    let filtered: string[] = [];
    if (!modelInput) {
      filtered = allModels;
    } else {
      filtered = allModels.filter((m) =>
        m.toLowerCase().startsWith(modelInput.toLowerCase())
      );
    }
    setModelOptions(filtered);
    if (filtered.length > 0) {
      setModelDropdown(true);
      Animated.timing(modelDropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setModelDropdown(false);
      Animated.timing(modelDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // Smart match: if input matches a valid model, auto-select
    const exact = allModels.find(
      (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
    );
    if (exact && modelInput && carModel !== exact) {
      setCarModel(exact);
      setModelInput(exact); // Keep the selected value in the input
      setModelDropdown(false);
      Animated.timing(modelDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      yearRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelInput, allModels]);

  // Handle brand select (manual click)
  const handleBrandSelect = (brand: string) => {
    setCarBrand(brand);
    setBrandInput("");
    setBrandDropdown(false);
    Animated.timing(brandDropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setCarModel("");
    setModelInput("");
    setAllModels([]);
    Keyboard.dismiss();
    modelRef.current?.focus();
  };

  // Handle model select (manual click)
  const handleModelSelect = (model: string) => {
    setCarModel(model);
    setModelInput("");
    setModelDropdown(false);
    Animated.timing(modelDropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Keyboard.dismiss();
    yearRef.current?.focus();
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
    const cacheKey = `${make.toLowerCase()}|${model.toLowerCase()}`;
    if (yearsCache.current[cacheKey]) {
      setAvailableYears(yearsCache.current[cacheKey]);
      return;
    }
    setYearLoading(true);
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
    yearsCache.current[cacheKey] = foundYears;
    setAvailableYears(foundYears);
    setYearLoading(false);
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
      Animated.timing(yearDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Reset carYear if input is cleared
      setCarYear("");
      return;
    }
    const filtered = availableYears.filter((y) => y.startsWith(yearInput));
    setYearOptions(filtered);
    if (filtered.length > 0) {
      setYearDropdown(true);
      Animated.timing(yearDropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setYearDropdown(false);
      Animated.timing(yearDropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // If input matches a valid year, set carYear
    if (availableYears.includes(yearInput)) {
      setCarYear(yearInput);
    } else {
      setCarYear("");
    }
  }, [yearInput, availableYears]);

  const handleSubmit = () => {
    setError("");
    console.log({ carBrand, carModel, carYear, mileage, problemDescription }); // Debug log
    if (!carBrand || !carModel || !carYear || !mileage || !problemDescription) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    setLoading(true);
    onSubmit({
      carBrand,
      carModel,
      carYear,
      mileage,
      problemDescription,
      image,
    });
    setLoading(false);
  };

  return (
    <View style={{ padding: 24, backgroundColor: "#111", minHeight: 600 }}>
      <Text
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        تحليل مشاكل السيارة
      </Text>
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        تفاصيل السيارة
      </Text>
      {/* --- Brand Input --- */}
      <View style={{ marginBottom: brandDropdown ? 80 : 8 }}>
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
            if (brandOptions.length > 0) {
              setBrandDropdown(true);
              Animated.timing(brandDropdownAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setBrandDropdown(false);
              Animated.timing(brandDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }, 200);
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Enter" || nativeEvent.key === "Return") {
              const exact = allBrands.find(
                (b) => b.toLowerCase() === brandInput.trim().toLowerCase()
              );
              if (exact) {
                setCarBrand(exact);
                setBrandDropdown(false);
                Animated.timing(brandDropdownAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                modelRef.current?.focus();
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
              Animated.timing(brandDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
              modelRef.current?.focus();
            }
          }}
          returnKeyType="next"
        />
        {brandDropdown && brandOptions.length > 0 && (
          <Animated.View
            style={{
              opacity: brandDropdownAnim,
              transform: [
                {
                  translateY: brandDropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
              position: "absolute",
              top: Platform.OS === "android" ? 48 : 44,
              left: 0,
              right: 0,
              backgroundColor: "#222",
              borderRadius: 8,
              zIndex: 10,
              maxHeight: 160,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <FlatList
              data={brandOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCarBrand(item);
                    setBrandInput(item);
                    setBrandDropdown(false);
                    Animated.timing(brandDropdownAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                    modelRef.current?.focus();
                  }}
                  style={{ padding: 12, backgroundColor: "#333" }}
                >
                  <Text style={{ color: "#fff" }}>{item}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        )}
      </View>
      {/* --- Model Input --- */}
      <View style={{ marginBottom: modelDropdown ? 80 : 8 }}>
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
            if (modelInput === "" && allModels.length > 0) {
              setModelOptions(allModels);
              setModelDropdown(true);
              Animated.timing(modelDropdownAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            } else if (modelOptions.length > 0) {
              setModelDropdown(true);
              Animated.timing(modelDropdownAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setModelDropdown(false);
              Animated.timing(modelDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }, 200);
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Enter" || nativeEvent.key === "Return") {
              const exact = allModels.find(
                (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
              );
              if (exact) {
                setCarModel(exact);
                setModelInput(exact);
                setModelDropdown(false);
                Animated.timing(modelDropdownAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                yearRef.current?.focus();
              }
            }
          }}
          onSubmitEditing={() => {
            const exact = allModels.find(
              (m) => m.toLowerCase() === modelInput.trim().toLowerCase()
            );
            if (exact) {
              setCarModel(exact);
              setModelInput(exact);
              setModelDropdown(false);
              Animated.timing(modelDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
              yearRef.current?.focus();
            }
          }}
          returnKeyType="next"
        />
        {modelDropdown && modelOptions.length > 0 && (
          <Animated.View
            style={{
              opacity: modelDropdownAnim,
              transform: [
                {
                  translateY: modelDropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
              position: "absolute",
              top: Platform.OS === "android" ? 48 : 44,
              left: 0,
              right: 0,
              backgroundColor: "#222",
              borderRadius: 8,
              zIndex: 10,
              maxHeight: 160,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <FlatList
              data={modelOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCarModel(item);
                    setModelInput(item);
                    setModelDropdown(false);
                    Animated.timing(modelDropdownAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                    yearRef.current?.focus();
                  }}
                  style={{ padding: 12, backgroundColor: "#333" }}
                >
                  <Text style={{ color: "#fff" }}>{item}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        )}
        {carBrand && allModels.length === 0 && (
          <Text style={{ color: "#f44", marginTop: 4 }}>
            No models found for this brand.
          </Text>
        )}
      </View>
      {/* --- Year Input --- */}
      <View style={{ marginBottom: yearDropdown ? 80 : 8 }}>
        <TextInput
          ref={yearRef}
          placeholder="مثال: 2019"
          value={yearInput}
          onChangeText={(text) => {
            setYearInput(text);
            if (availableYears.includes(text)) {
              setCarYear(text);
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
          editable={!!carModel}
          onFocus={() => {
            if (yearOptions.length > 0) {
              setYearDropdown(true);
              Animated.timing(yearDropdownAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setYearDropdown(false);
              Animated.timing(yearDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }, 200);
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Enter" || nativeEvent.key === "Return") {
              const exact = availableYears.find((y) => y === yearInput.trim());
              if (exact) {
                setYearInput(exact);
                setCarYear(exact); // Ensure carYear is set
                setYearDropdown(false);
                Animated.timing(yearDropdownAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
                mileageRef.current?.focus();
              }
            }
          }}
          onSubmitEditing={() => {
            const exact = availableYears.find((y) => y === yearInput.trim());
            if (exact) {
              setYearInput(exact);
              setCarYear(exact); // Ensure carYear is set
              setYearDropdown(false);
              Animated.timing(yearDropdownAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
              mileageRef.current?.focus();
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
          <Animated.View
            style={{
              opacity: yearDropdownAnim,
              transform: [
                {
                  translateY: yearDropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
              position: "absolute",
              top: Platform.OS === "android" ? 48 : 44,
              left: 0,
              right: 0,
              backgroundColor: "#222",
              borderRadius: 8,
              zIndex: 10,
              maxHeight: 160,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <FlatList
              data={yearOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setYearInput(item);
                    setCarYear(item); // Ensure carYear is set
                    setYearDropdown(false);
                    Animated.timing(yearDropdownAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                    mileageRef.current?.focus();
                  }}
                  style={{ padding: 12, backgroundColor: "#333" }}
                >
                  <Text style={{ color: "#fff" }}>{item}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        )}
      </View>
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
          marginBottom: 8,
        }}
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        onSubmitEditing={() => {
          // Optionally focus the next field (problemDescription) if you want
        }}
        returnKeyType="next"
      />
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
      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: "#3B82F6",
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          marginTop: 12,
        }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            تحليل المشكلة
          </Text>
        )}
      </TouchableOpacity>
      {error ? (
        <Text style={{ color: "#f44", marginTop: 8 }}>{error}</Text>
      ) : null}
    </View>
  );
};

export default CarFormStep;
