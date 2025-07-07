// [The file will be refactored to only handle step navigation and state, importing the modularized step components. All other code will be removed.]

import React, { useState } from "react";
import CarFormStep from "./screens/Diagnosis/CarFormStep";
import InitialResult from "./screens/Diagnosis/InitialResult";
import FollowUpQuestions from "./screens/Diagnosis/FollowUpQuestions";
import FinalResult from "./screens/Diagnosis/FinalResult";

const HomeScreen = () => {
  const [step, setStep] = useState<"form" | "initial" | "questions" | "final">(
    "form"
  );
  const [formData, setFormData] = useState<any>(null);
  const [initialResult, setInitialResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);

  const reset = () => {
    setStep("form");
    setFormData(null);
    setInitialResult(null);
    setQuestions([]);
    setAnswers([]);
    setFinalResult(null);
  };

  if (step === "form")
    return (
      <CarFormStep
        onSubmit={(data) => {
          setFormData(data);
          setStep("initial");
        }}
      />
    );
  if (step === "initial")
    return (
      <InitialResult
        formData={formData}
        onSmartAnalysis={(result: any, qs: any[]) => {
          setInitialResult(result);
          setQuestions(qs);
          setStep("questions");
        }}
        onBack={reset}
      />
    );
  if (step === "questions")
    return (
      <FollowUpQuestions
        questions={questions}
        onSubmit={(ans: any[]) => {
          setAnswers(ans);
          setStep("final");
        }}
        onBack={reset}
      />
    );
  if (step === "final")
    return (
      <FinalResult
        formData={formData}
        initialResult={initialResult}
        questions={questions}
        answers={answers}
        onNewAnalysis={reset}
      />
    );
  return null;
};

export default HomeScreen;
