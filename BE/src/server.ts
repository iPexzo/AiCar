import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze";
import { body, validationResult } from "express-validator";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log("=== Car AI Backend Server Starting ===");
console.log("=== CORS enabled for all origins ===");

// Enable CORS for all origins
app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Car AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/analyze", analyzeRouter);

// Direct route for /api/analyze-guided
app.post(
  "/api/analyze-guided",
  [
    body("carType").notEmpty().withMessage("Car type is required"),
    body("carModel").notEmpty().withMessage("Car model is required"),
    body("mileage").notEmpty().withMessage("Mileage is required"),
    body("problemDescription")
      .notEmpty()
      .withMessage("Problem description is required"),
  ],
  async (req: express.Request, res: express.Response) => {
    console.log("=== /api/analyze-guided endpoint hit ===");
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        carType,
        carModel,
        mileage,
        lastServiceType,
        problemDescription,
      } = req.body;

      // Compose the prompt in Arabic
      const prompt = `
أنت خبير ميكانيكي سيارات. بناءً على المعلومات التالية، قدم تحليلًا دقيقًا للمشكلة وتوصيات عملية:

نوع السيارة: ${carType}
الموديل: ${carModel}
الممشى: ${mileage} كم
${lastServiceType ? `آخر صيانة: ${lastServiceType}` : ""}
المشكلة: ${problemDescription}

يرجى أن يكون التحليل مفصلاً وواضحًا وباللغة العربية.
      `;

      // Call OpenAI GPT
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "أنت خبير ميكانيكي سيارات محترف." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse =
        completion.choices[0]?.message?.content?.trim() ||
        "لم يتم الحصول على تحليل من الذكاء الاصطناعي.";

      return res.json({
        success: true,
        result: aiResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        "Error in guided analysis:",
        error?.response?.data || error
      );
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error?.response?.data || error.message || error,
      });
    }
  }
);

// 404 handler
app.use("*", (req, res) => {
  console.log(
    `[DEBUG] 404 - Route not found: ${req.method} ${req.originalUrl}`
  );
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

// Start server
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 LAN Access: http://0.0.0.0:${PORT}`);
  console.log(
    `🎯 Target endpoint: http://192.168.8.149:${PORT}/api/analyze-guided`
  );
});

export default app;
