import axios from "axios";

export interface CarAnalysisPayload {
  carType: string;
  carModel: string;
  year: number;
  mileage: number;
  lastServiceType?: string;
  problemDescription: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: "text" | "multiple_choice";
  options?: string[];
}

export interface InitialAnalysisResponse {
  success: boolean;
  result: string;
  followUpQuestions: FollowUpQuestion[];
  timestamp: string;
}

export interface FollowUpAnswer {
  questionId: string;
  answer: string;
}

export interface FinalAnalysisRequest {
  initialAnalysis: string;
  followUpAnswers: FollowUpAnswer[];
  carDetails: {
    carType: string;
    carModel: string;
    mileage: string;
    lastServiceType?: string;
    problemDescription: string;
  };
  image?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file?: {
    filename: string;
    originalname: string;
    path: string;
    size: number;
    mimetype: string;
  };
  files?: Array<{
    filename: string;
    originalname: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
}

import { API_BASE_URL, API_CONFIG, UPLOAD_CONFIG } from "./config";

// Image upload endpoint
export async function uploadImage(imageFile: any): Promise<UploadResponse> {
  console.log("[DEBUG] ===== uploadImage START =====");
  console.log("[DEBUG] Uploading image:", imageFile);

  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axios.post(
      `${API_BASE_URL}/api/upload/image`,
      formData,
      UPLOAD_CONFIG
    );

    console.log("[DEBUG] Image upload successful:", response.data);
    console.log("[DEBUG] ===== uploadImage SUCCESS =====");
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] ===== uploadImage ERROR =====");
    console.error("[DEBUG] Image upload failed:", error);
    throw handleApiError(error);
  }
}

// Multiple images upload endpoint
export async function uploadMultipleImages(
  imageFiles: any[]
): Promise<UploadResponse> {
  console.log("[DEBUG] ===== uploadMultipleImages START =====");
  console.log("[DEBUG] Uploading images:", imageFiles.length);

  try {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/api/upload/images`,
      formData,
      UPLOAD_CONFIG
    );

    console.log("[DEBUG] Multiple images upload successful:", response.data);
    console.log("[DEBUG] ===== uploadMultipleImages SUCCESS =====");
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] ===== uploadMultipleImages ERROR =====");
    console.error("[DEBUG] Multiple images upload failed:", error);
    throw handleApiError(error);
  }
}

// Generate smart follow-up questions endpoint
export async function generateSmartQuestions(
  carDetails: {
    carType: string;
    carModel: string;
    mileage: string;
    lastServiceType?: string;
    problemDescription: string;
  },
  previousQuestions: string[],
  previousAnswers: string[],
  chatHistory?: string[]
): Promise<{
  success: boolean;
  questions: FollowUpQuestion[];
  timestamp: string;
  note: string;
}> {
  console.log("[DEBUG] ===== generateSmartQuestions START =====");
  console.log("[DEBUG] Car details:", carDetails);
  console.log("[DEBUG] Previous questions:", previousQuestions);
  console.log("[DEBUG] Previous answers:", previousAnswers);
  console.log("[DEBUG] Chat history:", chatHistory);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/generate-questions`,
      {
        carDetails,
        problemDescription: carDetails.problemDescription,
        previousQuestions,
        previousAnswers,
        chatHistory: chatHistory || [],
      },
      API_CONFIG
    );

    console.log(
      "[DEBUG] Smart questions generated successfully:",
      response.data
    );
    console.log("[DEBUG] ===== generateSmartQuestions SUCCESS =====");
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] ===== generateSmartQuestions ERROR =====");
    console.error("[DEBUG] Smart questions generation failed:", error);
    throw handleApiError(error);
  }
}

// --- Types for multi-step car diagnosis flow ---
export interface PreliminaryAnalysisResponse {
  success: boolean;
  result: string;
  followUpQuestions?: SmartQuestion[];
  [key: string]: any;
}

export interface SmartQuestion {
  id: string;
  question: string;
  type: string;
}

export interface SmartQuestionsPayload {
  carType: string;
  carModel: string;
  year: number;
  mileage: number;
  lastServiceType?: string;
  problemDescription: string;
  initialAnalysis: string;
}

export interface SmartQuestionsResponse {
  success: boolean;
  followUpQuestions: SmartQuestion[];
  [key: string]: any;
}

export interface FinalAnalysisPayload {
  carType: string;
  carModel: string;
  year: number;
  mileage: number;
  lastServiceType?: string;
  problemDescription: string;
  initialAnalysis: string;
  followUpQuestions: SmartQuestion[];
  followUpAnswers: string[];
}

export interface FinalAnalysisResponse {
  success: boolean;
  result: string;
  [key: string]: any;
}

// --- API functions ---

export async function analyzeCarProblem(
  payload: CarAnalysisPayload
): Promise<PreliminaryAnalysisResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get preliminary analysis");
  return res.json();
}

export async function getFollowUpQuestions(
  payload: SmartQuestionsPayload
): Promise<SmartQuestionsResponse> {
  const res = await fetch("/api/analyze-guided", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get smart questions");
  return res.json();
}

export async function getFinalAnalysis(
  payload: FinalAnalysisPayload
): Promise<FinalAnalysisResponse> {
  const res = await fetch("/api/analyze-followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get final analysis");
  return res.json();
}

// Add this function for guided analysis
export async function analyzeGuidedCarProblem(payload: CarAnalysisPayload) {
  const response = await axios.post(
    `${API_BASE_URL}/api/analyze-guided`,
    payload,
    API_CONFIG
  );
  return response.data;
}

// Helper function to handle API errors
function handleApiError(error: any) {
  if (error.code === "ECONNABORTED") {
    throw new Error("انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.");
  } else if (error.response) {
    throw new Error(`خطأ في الخادم: ${error.response.status}`);
  } else if (error.request) {
    throw new Error(
      "لا يمكن الوصول إلى الخادم. تأكد من تشغيل الخادم والاتصال بالشبكة."
    );
  } else {
    throw new Error("حدث خطأ غير متوقع.");
  }
}
