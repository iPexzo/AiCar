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
const BORDER = "#404040"; // Border color (medium gray)
const SHADOW = "rgba(0, 0, 0, 0.4)"; // Enhanced shadow
const INPUT_BG = "#1F1F1F"; // Input background (darker gray)

// Zod validation schema
const carAnalysisSchema = z.object({
  carType: z.string().min(1, "نوع السيارة مطلوب"),
  carModel: z.string().min(1, "موديل السيارة مطلوب"),
  mileage: z
    .string()
    .min(1, "الممشى مطلوب")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
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
  const [mileage, setMileage] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showErrors, setShowErrors] = useState(false);

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

  // Validation function
  const validateForm = () => {
    try {
      carAnalysisSchema.parse({
        carType: carType.trim(),
        carModel: carModel.trim(),
        mileage: mileage.trim(),
        problemDescription: problemDescription.trim(),
      });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  // Handle initial analysis
  const handleInitialAnalyze = () => {
    console.log("[DEBUG] ===== handleInitialAnalyze START =====");
    console.log("[DEBUG] Button clicked - handleInitialAnalyze called");
    console.log("[DEBUG] Form data:", {
      carType,
      carModel,
      mileage,
      problemDescription,
    });

    setShowErrors(true);

    // Validate form data
    if (!validateForm()) {
      console.log("[DEBUG] Validation failed");
      return;
    }

    console.log("[DEBUG] Validation passed, creating payload");
    const payload: CarAnalysisPayload = {
      carType: carType.trim(),
      carModel: carModel.trim(),
      mileage: mileage.trim(),
      problemDescription: problemDescription.trim(),
      image: selectedImage || undefined,
    };

    console.log("[DEBUG] Payload created:", payload);
    console.log("[DEBUG] About to call initialAnalysisMutation.mutate");
    console.log("[DEBUG] Mutation object:", initialAnalysisMutation);

    try {
      initialAnalysisMutation.mutate(payload);
      console.log("[DEBUG] Mutation.mutate() called successfully");
    } catch (error: any) {
      console.error("[DEBUG] Error calling mutation.mutate():", error);
      Alert.alert("خطأ", "حدث خطأ أثناء استدعاء التحليل");
    }

    console.log("[DEBUG] ===== handleInitialAnalyze END =====");
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
    setMileage("");
    setProblemDescription("");
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
              placeholder="مثال: تويوتا كامري"
              placeholderTextColor={SUBTEXT}
              value={carType}
              onChangeText={setCarType}
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
              placeholder="مثال: كامري 2019"
              placeholderTextColor={SUBTEXT}
              value={carModel}
              onChangeText={setCarModel}
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
              placeholder="مثال: 120000"
              placeholderTextColor={SUBTEXT}
              value={mileage}
              onChangeText={setMileage}
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
            {renderForm()}
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
