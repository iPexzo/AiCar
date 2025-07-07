import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from "react-native";

interface FollowUpQuestionsProps {
  questions: any[];
  onSubmit: (ans: any[]) => void;
  onBack: () => void;
}

function FollowUpQuestions({
  questions,
  onSubmit,
  onBack,
}: FollowUpQuestionsProps) {
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  function handleChange(text: string, idx: number) {
    const updated = [...answers];
    updated[idx] = text;
    setAnswers(updated);
  }

  function handleSubmit() {
    onSubmit(answers);
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
          الأسئلة الذكية
        </Text>
        {questions.map((q, idx) => (
          <View key={q.id || idx} style={styles.questionBlock}>
            <Text
              style={[
                styles.questionText,
                { color: isDark ? "#e0e0e0" : "#333" },
              ]}
            >
              {q.question}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#181A20" : "#fff",
                  color: isDark ? "#fff" : "#222",
                },
              ]}
              value={answers[idx]}
              onChangeText={(text) => handleChange(text, idx)}
              placeholder="اكتب إجابتك هنا"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              multiline
            />
          </View>
        ))}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDark ? "#2E8B57" : "#388e3c" },
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>تم</Text>
        </TouchableOpacity>
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
  questionBlock: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: "right",
    lineHeight: 26,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
    textAlign: "right",
    minHeight: 44,
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

export default FollowUpQuestions;
