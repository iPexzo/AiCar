import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// TypewriterText component for animated title
interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: any;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 25,
  style,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (text && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [text, currentIndex, speed]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

// ShimmerInput component for enhanced input fields
const ShimmerInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  style: any;
  multiline?: boolean;
}> = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  multiline,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={{ position: "relative" }}>
      <TextInput
        style={style}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: "transparent",
          opacity: shimmerOpacity,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["transparent", "rgba(59, 130, 246, 0.3)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            borderRadius: 12,
          }}
        />
      </Animated.View>
    </View>
  );
};

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

  // Animation refs
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const questionAnimations = useRef(
    questions.map(() => new Animated.Value(0))
  ).current;

  function handleChange(text: string, idx: number) {
    const updated = [...answers];
    updated[idx] = text;
    setAnswers(updated);
  }

  // Entrance animations
  useEffect(() => {
    // Card entrance animation
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Staggered question animations
    questionAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  function handleSubmit() {
    // Button bounce animation
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSubmit(answers);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: isDark ? "#181A20" : "#fff" }}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#23262F" : "#f7f7f7" },
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TypewriterText
          text="الأسئلة الذكية"
          speed={25}
          style={[styles.heading, { color: isDark ? "#fff" : "#222" }]}
        />
        {questions.map((q, idx) => (
          <Animated.View
            key={q.id || idx}
            style={[
              styles.questionBlock,
              {
                opacity: questionAnimations[idx],
                transform: [
                  {
                    translateY: questionAnimations[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.questionText,
                { color: isDark ? "#e0e0e0" : "#333" },
              ]}
            >
              {q.question}
            </Text>
            <ShimmerInput
              value={answers[idx]}
              onChangeText={(text) => handleChange(text, idx)}
              placeholder="اكتب إجابتك هنا"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#181A20" : "#fff",
                  color: isDark ? "#fff" : "#222",
                },
              ]}
              multiline
            />
          </Animated.View>
        ))}
        <Animated.View
          style={{
            transform: [{ scale: buttonAnim }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isDark ? "#2E8B57" : "#388e3c" },
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>تم</Text>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>رجوع</Text>
        </TouchableOpacity>
      </Animated.View>
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
