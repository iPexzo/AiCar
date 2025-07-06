import axios from "axios";

export interface CarAnalysisPayload {
  carType: string;
  carModel: string;
  mileage: string;
  lastServiceType?: string;
  problemDescription: string;
  image?: string; // base64 image data
  previousQuestions?: string[]; // Array of previously asked questions
  previousAnswers?: string[]; // Array of user answers to previous questions
  skipFollowUp?: boolean; // Flag to skip follow-up questions
  step?: "initial" | "questions" | "final"; // Step in the analysis flow
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

// Initial analysis endpoint (now only for initial diagnosis)
export async function analyzeCarProblem(
  payload: CarAnalysisPayload
): Promise<InitialAnalysisResponse> {
  console.log("[DEBUG] ===== analyzeCarProblem START =====");
  console.log("[DEBUG] analyzeCarProblem function called!");
  console.log("[DEBUG] Payload received:", payload);
  console.log("[DEBUG] Previous questions:", payload.previousQuestions);
  console.log("[DEBUG] Previous answers:", payload.previousAnswers);
  console.log("[DEBUG] Skip follow-up:", payload.skipFollowUp);
  console.log("[DEBUG] API_BASE_URL:", API_BASE_URL);
  console.log("[DEBUG] Full URL:", `${API_BASE_URL}/api/analyze-guided`);

  try {
    console.log("[DEBUG] About to make axios POST request...");
    console.log("[DEBUG] Request payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      payload,
      API_CONFIG
    );

    console.log("[DEBUG] Axios request successful!");
    console.log("[DEBUG] Response status:", response.status);
    console.log("[DEBUG] Response data:", response.data);
    console.log("[DEBUG] ===== analyzeCarProblem SUCCESS =====");
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] ===== analyzeCarProblem ERROR =====");
    console.error("[DEBUG] Initial analysis failed:", error);
    console.error("[DEBUG] Error type:", typeof error);
    console.error("[DEBUG] Error message:", error.message);
    console.error("[DEBUG] Error response:", error.response);
    console.error("[DEBUG] Error request:", error.request);
    throw handleApiError(error);
  }
}

// Follow-up analysis endpoint
export async function getFollowUpAnalysis(request: FinalAnalysisRequest) {
  console.log("[DEBUG] getFollowUpAnalysis function called!");
  console.log("[DEBUG] Request:", request);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-followup`,
      request,
      API_CONFIG
    );
    console.log("[DEBUG] Follow-up analysis response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] Follow-up analysis failed:", error);
    throw handleApiError(error);
  }
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
