import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import axios from "axios";

interface FinalResultProps {
  formData: any;
  initialResult: any;
  questions: any[];
  answers: any[];
  onNewAnalysis: () => void;
}

function FinalResult({
  formData,
  initialResult,
  questions,
  answers,
  onNewAnalysis,
}: FinalResultProps) {
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState<string>("");
  const [error, setError] = useState<string | false>(false);
  const [repairInstructions, setRepairInstructions] = useState<string[]>([]);
  const [requiredParts, setRequiredParts] = useState<string[]>([]);
  const [repairInstructionsWithVideos, setRepairInstructionsWithVideos] =
    useState<
      Array<{
        step: string;
        videoUrl: string | null;
        videoTitle: string | null;
      }>
    >([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Helper: Validate payload fields
  function isPayloadValid(payload: any) {
    return (
      payload.initialAnalysis &&
      typeof payload.initialAnalysis === "string" &&
      Array.isArray(payload.followUpAnswers) &&
      payload.carDetails &&
      typeof payload.carDetails.brand === "string" &&
      typeof payload.carDetails.model === "string" &&
      typeof payload.carDetails.year === "number" &&
      payload.carDetails.brand.length > 0 &&
      payload.carDetails.model.length > 0
    );
  }

  // Helper: Parse 'تعليمات الإصلاح' section from aiResult
  function parseRepairInstructions(aiResult: string): string[] {
    // Find the section header
    const match = aiResult.match(
      /🔧 تعليمات الإصلاح[\s\S]*?(?=\n[A-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]|$)/
    );
    if (!match) return [];
    const section = match[0];
    // Extract numbered steps (Arabic or English numbers)
    const lines = section
      .split("\n")
      .filter((line) => line.trim().match(/^(\d+|[١-٩][٠-٩]*)[\.|\-]/));
    return lines.map((line) =>
      line.replace(/^(\d+|[١-٩][٠-٩]*)[\.|\-]\s*/, "").trim()
    );
  }

  // Helper: Parse 'قطع الغيار المطلوبة' section from aiResult
  function parseRequiredParts(aiResult: string): string[] {
    // Find the section header
    const match = aiResult.match(
      /🧩 قطع الغيار المطلوبة[\s\S]*?(?=\n[A-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]|$)/
    );
    if (!match) return [];
    const section = match[0];
    // Extract numbered steps (Arabic or English numbers)
    const lines = section
      .split("\n")
      .filter((line) => line.trim().match(/^(\d+|[١-٩][٠-٩]*)[\.|\-]/));
    return lines.map((line) =>
      line.replace(/^(\d+|[١-٩][٠-٩]*)[\.|\-]\s*/, "").trim()
    );
  }

  // Helper: Extract video links from instruction text
  function extractVideoLink(instruction: string): {
    text: string;
    link: string | null;
  } {
    // Look for URL patterns in the instruction
    const urlMatch = instruction.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const link = urlMatch[1];
      const text = instruction.replace(link, "").trim();
      return { text, link };
    }
    return { text: instruction, link: null };
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchFinalAnalysis() {
      setLoading(true);
      setError(false);
      // Prepare the prompt in Arabic as requested
      const carBrand = formData?.carBrand || "";
      const carModel = formData?.carModel || "";
      const carYear = formData?.carYear || "";
      const problemDescription = formData?.problemDescription || "";
      const initial =
        typeof initialResult === "string"
          ? initialResult
          : initialResult?.toString?.() || "";
      const previousQuestions = Array.isArray(questions) ? questions : [];
      const previousAnswers = Array.isArray(answers)
        ? answers.map((a) => (typeof a === "string" ? a : String(a)))
        : [];
      const followUpQuestions = previousQuestions.map((q) =>
        typeof q === "string" ? q : q.question || ""
      );
      const prompt = `سيارة المستخدم هي: ${carBrand} ${carModel} ${carYear}\nوصف المستخدم للمشكلة: ${problemDescription}\n\nالتحليل المبدئي:\n${initial}\n\nالأسئلة الذكية والإجابات:\n${previousQuestions
        .map((q, i) => `س: ${q.question}\nج: ${previousAnswers[i] || ""}`)
        .join(
          "\n"
        )}\n\nاعتمد على المعلومات أعلاه وقدم تحليل نهائي دقيق وشخص المشكلة، ثم اعرض:\n1. المشكلة الرئيسية\n2. الأجزاء المطلوبة\n3. الأسعار التقريبية بناءً على نوع السيارة\n4. تعليمات الإصلاح\n5. المراكز المعتمدة حسب نوع السيارة\n6. نصائح وقائية\n\nاكتب الرد بالعربية`;
      const payload = {
        initialAnalysis: initial,
        followUpQuestions,
        followUpAnswers: previousAnswers,
        carDetails: {
          brand: carBrand,
          model: carModel,
          year: Number(carYear),
        },
        prompt,
      };
      console.log("/api/analyze-followup payload", payload);
      if (!isPayloadValid(payload)) {
        setError(
          "⚠️ بعض الحقول ناقصة أو غير صحيحة. يرجى التأكد من إدخال جميع البيانات بشكل صحيح."
        );
        setLoading(false);
        return;
      }
      try {
        const response = await axios.post(
          "http://localhost:8001/api/analyze-followup",
          payload
        );
        console.log("AI Final Response", response.data);
        if (isMounted && response.data && response.data.result) {
          setAiResult(response.data.result);
          // Extract repairInstructionsWithVideos from the API response
          if (
            response.data.repairInstructionsWithVideos &&
            Array.isArray(response.data.repairInstructionsWithVideos)
          ) {
            setRepairInstructionsWithVideos(
              response.data.repairInstructionsWithVideos
            );
          } else {
            setRepairInstructionsWithVideos([]);
          }
        } else if (isMounted) {
          setAiResult("");
          setRepairInstructionsWithVideos([]);
          setError("❌ لم يتم استلام نتيجة من الذكاء الاصطناعي.");
        }
      } catch (e: any) {
        let apiError = "❌ حدث خطأ أثناء جلب التحليل النهائي.";
        if (e.response) {
          apiError =
            e.response.data?.error ||
            JSON.stringify(e.response.data) ||
            apiError;
          console.log("AI Final Error Response", e.response.data);
        } else if (e.request) {
          apiError = "❌ لم يتم تلقي استجابة من الخادم. تحقق من الاتصال.";
          console.log("AI Final Error No Response", e.request);
        } else {
          apiError = e.message || apiError;
        }
        if (isMounted) {
          setAiResult("");
          setRepairInstructionsWithVideos([]);
          setError(apiError);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchFinalAnalysis();
    return () => {
      isMounted = false;
    };
  }, [formData, initialResult, questions, answers]);

  // Parse instructions when aiResult changes
  useEffect(() => {
    if (!aiResult) {
      setRepairInstructions([]);
      setRequiredParts([]);
      setRepairInstructionsWithVideos([]);
      return;
    }
    const steps = parseRepairInstructions(aiResult);
    setRepairInstructions(steps);
    const requiredParts = parseRequiredParts(aiResult);
    setRequiredParts(requiredParts);
  }, [aiResult]);

  // Compose the car intro for the result
  const carIntro =
    formData?.carBrand && formData?.carModel && formData?.carYear
      ? `سيارتك ${formData.carBrand} ${formData.carModel} ${formData.carYear} تعاني من...`
      : "تشخيص السيارة";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: isDark ? "#181A20" : "#fff" }}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#23262F" : "#f7f7f7" },
        ]}
      >
        <Text style={[styles.heading, { color: isDark ? "#fff" : "#222" }]}>
          التحليل النهائي
        </Text>
        {loading && (
          <View style={{ marginVertical: 32 }}>
            <ActivityIndicator
              size="large"
              color={isDark ? "#b2ffb2" : "#2E8B57"}
            />
            <Text
              style={{
                color: isDark ? "#b2ffb2" : "#2E8B57",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              جاري التحليل النهائي...
            </Text>
          </View>
        )}
        {!loading && aiResult && (
          <>
            <Text
              style={[styles.diagnosis, { color: isDark ? "#e0e0e0" : "#333" }]}
            >
              <Text style={{ fontWeight: "bold" }}>{carIntro}</Text>
              {"\n"}
              {aiResult}
            </Text>

            {/* Required Parts (without videos) */}
            {requiredParts.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    marginBottom: 8,
                    color: isDark ? "#b2ffb2" : "#2E8B57",
                  }}
                >
                  قطع الغيار المطلوبة
                </Text>
                {requiredParts.map((part, idx) => (
                  <Text
                    key={idx}
                    style={{
                      color: isDark ? "#e0e0e0" : "#333",
                      marginBottom: 4,
                    }}
                  >
                    {idx + 1}. {part}
                  </Text>
                ))}
              </View>
            )}

            {/* Repair Instructions with video links from backend */}
            {(repairInstructionsWithVideos.length > 0 ||
              repairInstructions.length > 0) && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    marginBottom: 8,
                    color: isDark ? "#b2ffb2" : "#2E8B57",
                  }}
                >
                  تعليمات الإصلاح
                </Text>
                {(repairInstructionsWithVideos.length > 0
                  ? repairInstructionsWithVideos
                  : repairInstructions.map((step) => ({
                      step,
                      videoUrl: null,
                      videoTitle: null,
                    }))
                ).map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 8 }}>
                    <Text
                      style={{
                        color: isDark ? "#e0e0e0" : "#333",
                        marginBottom: 4,
                      }}
                    >
                      {idx + 1}. {item.step}
                    </Text>
                    {item.videoUrl && (
                      <TouchableOpacity
                        onPress={() => {
                          if (Platform.OS === "web") {
                            window.open(item.videoUrl!, "_blank");
                          } else {
                            Linking.openURL(item.videoUrl!);
                          }
                        }}
                        style={{
                          marginLeft: 20,
                          marginTop: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: isDark ? "#90caf9" : "#1976d2",
                            fontSize: 14,
                            textDecorationLine: "underline",
                          }}
                        >
                          🎥 {item.videoTitle || "شاهد فيديو الإصلاح"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {!loading && error && (
          <Text
            style={[
              styles.diagnosis,
              { color: isDark ? "#e57373" : "#b71c1c" },
            ]}
          >
            {error}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDark ? "#2E8B57" : "#388e3c" },
          ]}
          onPress={onNewAnalysis}
        >
          <Text style={styles.buttonText}>تحليل مشكلة جديدة</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  diagnosis: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "400",
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default FinalResult;
