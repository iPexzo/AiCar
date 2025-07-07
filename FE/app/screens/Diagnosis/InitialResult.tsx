import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

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
          <Text
            style={[styles.diagnosis, { color: isDark ? "#e0e0e0" : "#333" }]}
          >
            {diagnosis}
          </Text>
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
            <Text style={styles.buttonText}>الأسئلة الذكية</Text>
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
