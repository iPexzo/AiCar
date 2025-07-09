import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  TextProps,
  Animated,
} from "react-native";
import axios from "axios";

// Enhanced TypewriterText component with ChatGPT-like visual effects
interface TypewriterTextProps extends TextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  textColor?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 12,
  onComplete,
  style,
  textColor,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [characterWeights, setCharacterWeights] = useState<{
    [key: number]: boolean;
  }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef<NodeJS.Timeout | null>(null);
  const weightRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  // Blinking cursor effect
  useEffect(() => {
    cursorRef.current = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      if (cursorRef.current) {
        clearInterval(cursorRef.current);
      }
    };
  }, []);

  // Character weight transition effect
  useEffect(() => {
    if (text && currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        const newIndex = currentIndex + 1;
        setDisplayedText(text.slice(0, newIndex));
        setCurrentIndex(newIndex);

        // Set character to light weight initially
        setCharacterWeights((prev) => ({ ...prev, [currentIndex]: false }));

        // After 100ms, make the character bold and fully visible
        weightRefs.current[currentIndex] = setTimeout(() => {
          setCharacterWeights((prev) => ({ ...prev, [currentIndex]: true }));
        }, 100);
      }, speed);
    } else if (currentIndex >= text.length && onComplete) {
      onComplete();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, currentIndex, speed, onComplete]);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setCurrentIndex(0);
    setCharacterWeights({});

    // Clear all weight timeouts
    Object.values(weightRefs.current).forEach((timeout) => {
      if (timeout) clearTimeout(timeout);
    });
    weightRefs.current = {};
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cursorRef.current) {
        clearInterval(cursorRef.current);
      }
      Object.values(weightRefs.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <Text style={style} {...props}>
      {displayedText.split("").map((char, index) => (
        <Animated.Text
          key={index}
          style={{
            fontWeight: characterWeights[index] ? "bold" : "100",
            opacity: characterWeights[index] ? 1 : 0.35,
            color: characterWeights[index] ? textColor || "#333" : "#999",
          }}
        >
          {char}
        </Animated.Text>
      ))}
      {currentIndex < text.length && showCursor && "|"}
    </Text>
  );
};

interface InitialResultProps {
  formData: any;
  onSmartAnalysis: (result: any, qs: any[]) => void;
  onBack: () => void;
}

function InitialResult({
  formData,
  onSmartAnalysis,
  onBack,
}: InitialResultProps) {
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [followUpQuestions, setFollowUpQuestions] = useState<any[]>([]);
  const [error, setError] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let isMounted = true;
    async function fetchDiagnosis() {
      setLoading(true);
      setError(false);
      try {
        const payload = {
          carType: formData?.carBrand,
          carModel: formData?.carModel,
          mileage: formData?.mileage,
          problemDescription: formData?.problemDescription,
          lastServiceType: "غير محدد",
          previousQuestions: [],
          previousAnswers: [],
        };
        const res = await axios.post(
          "http://localhost:8001/api/analyze-guided",
          payload
        );
        if (isMounted && res.data) {
          setDiagnosis(res.data.result || "");
          setFollowUpQuestions(res.data.followUpQuestions || []);
        } else if (isMounted) {
          setDiagnosis("");
          setFollowUpQuestions([]);
        }
      } catch (e) {
        if (isMounted) {
          setDiagnosis("");
          setFollowUpQuestions([]);
          setError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDiagnosis();
    return () => {
      isMounted = false;
    };
  }, [formData]);

  const showDiagnosis = !loading && diagnosis;
  const showError = !loading && (!diagnosis || error);

  function handleSmartQuestions() {
    onSmartAnalysis(diagnosis, followUpQuestions);
  }

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
          التحليل الأولي
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
              جاري التحميل...
            </Text>
          </View>
        )}
        {showDiagnosis && (
          <TypewriterText
            text={diagnosis}
            style={[styles.diagnosis, { color: isDark ? "#e0e0e0" : "#333" }]}
            textColor={isDark ? "#e0e0e0" : "#333"}
            speed={12}
            onComplete={() => console.log("Typewriter effect completed")}
          />
        )}
        {showError && (
          <Text
            style={[
              styles.diagnosis,
              { color: isDark ? "#e57373" : "#b71c1c" },
            ]}
          >
            حدث خطأ أثناء جلب التشخيص.
          </Text>
        )}
        {!loading && !!diagnosis && followUpQuestions.length > 0 && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isDark ? "#2E8B57" : "#388e3c" },
            ]}
            onPress={handleSmartQuestions}
          >
            <Text style={styles.buttonText}>الأسئلة الذكية لتحليل أدق</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>رجوع</Text>
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#888",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#888",
    fontSize: 16,
  },
});

export default InitialResult;
