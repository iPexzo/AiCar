import { Platform } from "react-native";

// Dynamic API configuration for different environments
const getApiBaseUrl = () => {
  // Check if running in development
  if (__DEV__) {
    // For Android Emulator
    if (Platform.OS === "android") {
      return "http://10.0.2.2:8001";
    }

    // For iOS Simulator
    if (Platform.OS === "ios") {
      return "http://localhost:8001";
    }

    // For web development
    return "http://localhost:8001";
  }

  // For production (replace with your production API URL)
  return "https://your-production-api.com";
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API configuration for debugging
console.log(`[API Config] Platform: ${Platform.OS}`);
console.log(`[API Config] API Base URL: ${API_BASE_URL}`);
console.log(`[API Config] Development Mode: ${__DEV__}`);

// Export configuration object
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Upload configuration
export const UPLOAD_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
};
