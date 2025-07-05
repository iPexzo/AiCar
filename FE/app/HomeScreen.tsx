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
import {
  analyzeCarProblem,
  getFollowUpAnalysis,
  CarAnalysisPayload,
  FollowUpAnswer,
} from "../api/analyze";

const BG = "#23272f";
const CARD = "#313543";
const ACCENT = "#00bcd4";
const TEXT = "#fff";
const SUBTEXT = "#b0b8c1";
const BTN = "#00bcd4";
const BTN_TEXT = "#fff";
const RESULT_BG = "#222b2f";
const SUCCESS = "#4caf50";

const HomeScreen = () => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const questionAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const sectionAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

  // Animation functions
  const animateIn = () => {
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

  const animateQuestions = () => {
    questionAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 800, // 0.8s delay between each question
        useNativeDriver: true,
      }).start();
    });
  };

  const resetAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    questionAnimations.forEach((anim) => anim.setValue(0));
    sectionAnimations.forEach((anim) => anim.setValue(0));
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

    // Validate form data
    if (
      !carType.trim() ||
      !carModel.trim() ||
      !mileage.trim() ||
      !problemDescription.trim()
    ) {
      console.log("[DEBUG] Validation failed - missing fields");
      Alert.alert("خطأ", "يرجى تعبئة جميع الحقول المطلوبة");
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
    setSelectedImage(null);
    setCarType("");
    setCarModel("");
    setMileage("");
    setProblemDescription("");
  };

  // Handle smart questions transition
  const handleSmartQuestionsTransition = () => {
    setCurrentStep("follow-up");
    // Start question animations after a short delay
    setTimeout(() => {
      animateQuestions();
    }, 300);
  };

  // Animate sections gradually
  const animateSections = () => {
    sectionAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 1000, // 1 second delay between each section
        useNativeDriver: true,
      }).start();
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
      icon: "✅",
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
          icon: "✅",
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
          icon: "🛠",
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
          icon: "💰",
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
          icon: "⚠",
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
        icon: "✅",
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
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        معلومات السيارة
      </Text>

      {/* Car Type */}
      <TextInput
        placeholder="نوع السيارة (مثال: Toyota)"
        placeholderTextColor={SUBTEXT}
        value={carType}
        onChangeText={setCarType}
        style={{
          backgroundColor: BG,
          borderRadius: 8,
          padding: 12,
          color: TEXT,
          marginBottom: 12,
          fontSize: 16,
        }}
      />

      {/* Car Model */}
      <TextInput
        placeholder="موديل السيارة (مثال: Camry 2019)"
        placeholderTextColor={SUBTEXT}
        value={carModel}
        onChangeText={setCarModel}
        style={{
          backgroundColor: BG,
          borderRadius: 8,
          padding: 12,
          color: TEXT,
          marginBottom: 12,
          fontSize: 16,
        }}
      />

      {/* Mileage */}
      <TextInput
        placeholder="الممشى بالكيلومتر (مثال: 120000)"
        placeholderTextColor={SUBTEXT}
        value={mileage}
        onChangeText={setMileage}
        keyboardType="numeric"
        style={{
          backgroundColor: BG,
          borderRadius: 8,
          padding: 12,
          color: TEXT,
          marginBottom: 12,
          fontSize: 16,
        }}
      />

      {/* Problem Description */}
      <TextInput
        placeholder="اشرح المشكلة بالتفصيل..."
        placeholderTextColor={SUBTEXT}
        value={problemDescription}
        onChangeText={setProblemDescription}
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: BG,
          borderRadius: 8,
          padding: 12,
          color: TEXT,
          marginBottom: 20,
          fontSize: 16,
          minHeight: 100,
          textAlignVertical: "top",
        }}
      />

      {/* Image Upload */}
      <TouchableOpacity
        onPress={pickImage}
        style={{
          backgroundColor: BG,
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          borderWidth: 2,
          borderColor: selectedImage ? SUCCESS : SUBTEXT,
          borderStyle: "dashed",
          alignItems: "center",
        }}
      >
        {selectedImage ? (
          <View style={{ alignItems: "center" }}>
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
            <Text style={{ color: SUCCESS, fontSize: 14 }}>
              ✓ تم اختيار الصورة
            </Text>
          </View>
        ) : (
          <Text style={{ color: SUBTEXT, fontSize: 16 }}>
            📷 إضافة صورة (اختياري)
          </Text>
        )}
      </TouchableOpacity>

      {/* Analyze Button */}
      <TouchableOpacity
        onPress={handleInitialAnalyze}
        disabled={initialAnalysisMutation.isPending}
        style={{
          backgroundColor: initialAnalysisMutation.isPending ? "#666" : BTN,
          borderRadius: 8,
          padding: 16,
          alignItems: "center",
          opacity: initialAnalysisMutation.isPending ? 0.7 : 1,
        }}
      >
        {initialAnalysisMutation.isPending ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              جاري التحليل...
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
            🔍 تحليل المشكلة
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render initial result step
  const renderInitialResult = () => (
    <Animated.View
      style={{
        backgroundColor: RESULT_BG,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
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

      <TouchableOpacity
        onPress={handleSmartQuestionsTransition}
        style={{
          backgroundColor: ACCENT,
          borderRadius: 8,
          padding: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: BTN_TEXT, fontSize: 16, fontWeight: "600" }}>
          تحليل أذكى؟ اضغط للحصول على أسئلة تفصيلية!
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render follow-up questions step
  const renderFollowUpQuestions = () => (
    <Animated.View
      style={{
        backgroundColor: CARD,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        أسئلة تفصيلية لتحليل أفضل
      </Text>

      {followUpQuestions.map((question, index) => (
        <Animated.View
          key={question.id}
          style={{
            marginBottom: 20,
            opacity: questionAnimations[index],
            transform: [
              {
                translateY: questionAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <Text
            style={{
              color: TEXT,
              fontSize: 16,
              fontWeight: "500",
              marginBottom: 12,
            }}
          >
            {index + 1}. {question.question}
          </Text>

          {question.type === "multiple_choice" && question.options ? (
            <View>
              {question.options.map((option: string) => {
                const isSelected =
                  followUpAnswers.find((a) => a.questionId === question.id)
                    ?.answer === option;

                return (
                  <TouchableOpacity
                    key={option}
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
        </Animated.View>
      ))}

      <TouchableOpacity
        onPress={handleFinalAnalyze}
        disabled={
          followUpAnalysisMutation.isPending ||
          followUpAnswers.length < followUpQuestions.length
        }
        style={{
          backgroundColor:
            followUpAnswers.length < followUpQuestions.length ? SUBTEXT : BTN,
          borderRadius: 8,
          padding: 16,
          alignItems: "center",
          opacity: followUpAnalysisMutation.isPending ? 0.7 : 1,
        }}
      >
        {followUpAnalysisMutation.isPending ? (
          <ActivityIndicator color={BTN_TEXT} size="small" />
        ) : (
          <Text
            style={{
              color: BTN_TEXT,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            إرسال الإجابات
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Render final result step
  const renderFinalResult = () => (
    <Animated.View
      style={{
        backgroundColor: RESULT_BG,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text
        style={{
          color: TEXT,
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        التحليل النهائي
      </Text>

      {analysisSections.map((section, index) => (
        <Animated.View
          key={section.type}
          style={{
            marginBottom: 16,
            opacity: sectionAnimations[index],
            transform: [
              {
                translateY: sectionAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: ACCENT,
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
              <Text style={{ fontSize: 20, marginRight: 8 }}>
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
                        key={lineIndex}
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
          borderRadius: 8,
          padding: 16,
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text style={{ color: BTN_TEXT, fontSize: 16, fontWeight: "600" }}>
          تحليل مشكلة جديدة
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={{ maxWidth: 500, alignSelf: "center", width: "100%" }}>
        {/* Header */}
        <Text
          style={{
            color: TEXT,
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          تحليل مشاكل السيارة بالذكاء الاصطناعي
        </Text>

        {/* Render current step */}
        {currentStep === "form" && renderForm()}
        {currentStep === "initial-result" && renderInitialResult()}
        {currentStep === "follow-up" && renderFollowUpQuestions()}
        {currentStep === "final-result" && renderFinalResult()}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
