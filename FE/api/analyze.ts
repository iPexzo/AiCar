import axios from "axios";

export interface CarAnalysisPayload {
  carType: string;
  carModel: string;
  mileage: string;
  lastServiceType?: string;
  problemDescription: string;
}

const API_URL = "http://192.168.8.149:8001/api/analyze-guided";

export async function analyzeCarProblem(payload: CarAnalysisPayload) {
  console.log("[DEBUG] analyzeCarProblem function called!");
  console.log("[DEBUG] API_URL:", API_URL);
  console.log("[DEBUG] Payload received:", payload);
  console.log("[DEBUG] About to send axios.post request...");

  try {
    const response = await axios.post(API_URL, payload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("[DEBUG] axios.post request completed successfully!");
    console.log("[DEBUG] Response received:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] axios.post request failed:", error);
    console.error("[DEBUG] Error details:", {
      code: error.code,
      message: error.message,
      response: error.response?.status,
      request: error.request
        ? "Request was made but no response"
        : "No request was made",
    });

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
}
