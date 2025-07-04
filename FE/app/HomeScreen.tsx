import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { analyzeCarProblem, CarAnalysisPayload } from "../api/analyze";

const BG = "#23272f";
const CARD = "#313543";
const ACCENT = "#00bcd4";
const TEXT = "#fff";
const SUBTEXT = "#b0b8c1";
const BTN = "#00bcd4";
const BTN_TEXT = "#fff";
const RESULT_BG = "#222b2f";

const HomeScreen = () => {
  // Form state
  const [carType, setCarType] = useState("");
  const [carModel, setCarModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [lastServiceType, setLastServiceType] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");

  // React Query mutation
  const analyzeMutation = useMutation({
    mutationFn: analyzeCarProblem,
    onSuccess: (data) => {
      console.log("[DEBUG] useMutation onSuccess triggered!");
      console.log("[DEBUG] Analysis successful:", data);
      setAnalysisResult(data.result || data.message || "تم التحليل بنجاح");
    },
    onError: (error: any) => {
      console.log("[DEBUG] useMutation onError triggered!");
      console.error("[DEBUG] Analysis failed:", error);
      setAnalysisResult("");
      Alert.alert("خطأ", error.message || "حدث خطأ أثناء التحليل");
    },
  });

  const handleAnalyze = () => {
    console.log("[DEBUG] handleAnalyze function triggered!");

    // Validate required fields
    if (
      !carType.trim() ||
      !carModel.trim() ||
      !mileage.trim() ||
      !problemDescription.trim()
    ) {
      console.log("[DEBUG] Validation failed - missing required fields");
      Alert.alert("خطأ", "يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    console.log("[DEBUG] Validation passed, preparing payload...");

    // Clear previous result
    setAnalysisResult("");

    // Prepare payload
    const payload: CarAnalysisPayload = {
      carType: carType.trim(),
      carModel: carModel.trim(),
      mileage: mileage.trim(),
      lastServiceType: lastServiceType.trim() || undefined,
      problemDescription: problemDescription.trim(),
    };

    console.log("[DEBUG] Payload prepared:", payload);
    console.log("[DEBUG] About to call analyzeMutation.mutate()");
    analyzeMutation.mutate(payload);
    console.log("[DEBUG] analyzeMutation.mutate() called");
  };

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
          تحليل مشاكل السيارة
        </Text>

        {/* Form Card */}
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

          {/* Last Service Type (Optional) */}
          <TextInput
            placeholder="آخر صيانة (مثال: تغيير زيت) - اختياري"
            placeholderTextColor={SUBTEXT}
            value={lastServiceType}
            onChangeText={setLastServiceType}
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

          {/* Analyze Button */}
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={analyzeMutation.isPending}
            style={{
              backgroundColor: BTN,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              opacity: analyzeMutation.isPending ? 0.7 : 1,
            }}
          >
            {analyzeMutation.isPending ? (
              <ActivityIndicator color={BTN_TEXT} size="small" />
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

        {/* Results */}
        {analysisResult && (
          <View
            style={{
              backgroundColor: RESULT_BG,
              borderRadius: 16,
              padding: 20,
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
              نتيجة التحليل
            </Text>
            <Text
              style={{
                color: TEXT,
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              {analysisResult}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
