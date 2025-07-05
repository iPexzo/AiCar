import axios from "axios";

export interface CarAnalysisPayload {
  carType: string;
  carModel: string;
  mileage: string;
  lastServiceType?: string;
  problemDescription: string;
  image?: string; // base64 image data
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

const API_BASE_URL = "http://192.168.8.149:8001";

// Initial analysis endpoint
export async function analyzeCarProblem(
  payload: CarAnalysisPayload
): Promise<InitialAnalysisResponse> {
  console.log("[DEBUG] ===== analyzeCarProblem START =====");
  console.log("[DEBUG] analyzeCarProblem function called!");
  console.log("[DEBUG] Payload received:", payload);
  console.log("[DEBUG] API_BASE_URL:", API_BASE_URL);
  console.log("[DEBUG] Full URL:", `${API_BASE_URL}/api/analyze-guided`);

  try {
    console.log("[DEBUG] About to make axios POST request...");
    console.log("[DEBUG] Request payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-guided`,
      payload,
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      }
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
      {
        timeout: 20000,
        headers: {
          "Content-Type": "application/json",
        },
      }
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
