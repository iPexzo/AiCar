import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze";
import uploadRouter from "./routes/upload";
import { body, validationResult } from "express-validator";
import OpenAI from "openai";

// Load environment variables
dotenv.config();
console.log("Loaded OpenAI Key:", process.env.OPENAI_API_KEY?.slice(0, 12));

const app = express();
const PORT = process.env.PORT || 8001;

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY is not configured!");
  console.warn("   The AI analysis will use a fallback template response.");
  console.warn(
    "   To enable real AI analysis, add your OpenAI API key to .env file"
  );
}

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
app.use("/api/upload", uploadRouter);

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

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.log(
          "[DEBUG] Fallback template response path used (no OpenAI key)"
        );

        // Fallback template response
        const fallbackAnalysis = `
🚗 تحليل مشكلة السيارة - الكويت

📋 معلومات السيارة:
- النوع: ${carType}
- الموديل: ${carModel}
- الممشى: ${mileage} كم
${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}

🔍 المشكلة المذكورة:
${problemDescription}

✅ التحليل الأولي:
بناءً على المعلومات المقدمة، يبدو أن المشكلة تتطلب فحصاً دقيقاً. 

🔧 التوصيات للكويت:
1. قم بفحص السيارة لدى ميكانيكي متخصص في الكويت
2. تأكد من صيانة السيارة الدورية
3. راقب أي أعراض إضافية
4. خذ في الاعتبار الظروف المناخية في الكويت

💰 أسعار قطع الغيار المتوقعة:
- سيتم تقدير الأسعار بالدينار الكويتي (د.ك) بعد التحليل التفصيلي

⚠️ ملاحظة: هذا تحليل أولي. للحصول على تشخيص دقيق، استشر ميكانيكي محترف في الكويت.

🔧 للتحليل المتقدم: يرجى إضافة مفتاح OpenAI API في ملف .env
        `;

        // Generate follow-up questions for fallback response
        const followUpQuestions = [
          {
            id: "1",
            question: "هل تسمع أصوات غريبة من المحرك؟",
            type: "multiple_choice",
            options: ["نعم", "لا", "أحياناً"],
          },
          {
            id: "2",
            question: "متى بدأت هذه المشكلة؟",
            type: "text",
          },
          {
            id: "3",
            question: "هل تزداد المشكلة مع زيادة السرعة؟",
            type: "multiple_choice",
            options: ["نعم", "لا", "لا أعرف"],
          },
        ];

        return res.json({
          success: true,
          result: fallbackAnalysis.trim(),
          followUpQuestions,
          timestamp: new Date().toISOString(),
          note: "Fallback response - OpenAI API key not configured",
        });
      }

      // Compose the prompt in Arabic with Kuwait-specific context
      const prompt = `
أنت خبير ميكانيكي سيارات في الكويت. بناءً على المعلومات التالية، قدم تحليلًا دقيقًا للمشكلة وتوصيات عملية:

نوع السيارة: ${carType}
الموديل: ${carModel}
الممشى: ${mileage} كم
${lastServiceType ? `آخر صيانة: ${lastServiceType}` : ""}
المشكلة: ${problemDescription}

ملاحظات مهمة:
- أنت في الكويت، استخدم الدينار الكويتي (د.ك) للأسعار
- اذكر أسعار قطع الغيار المتوقعة في الكويت
- اقترح مراكز صيانة موثوقة في الكويت
- خذ في الاعتبار الظروف المناخية في الكويت (الحرارة والرطوبة)

يرجى أن يكون التحليل مفصلاً وواضحًا وباللغة العربية مع التركيز على السياق الكويتي.
      `;

      console.log("Calling OpenAI API...");

      // Call OpenAI GPT for initial analysis
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

      console.log("[DEBUG] OpenAI API call path used");
      console.log("OpenAI API call successful");

      // --- Use dedicated smart questions function ---
      let followUpQuestions: any[] = [];
      try {
        followUpQuestions = await generateSmartQuestions({
          carType,
          carModel,
          mileage,
          problemDescription,
        });
        console.log("[DEBUG] Smart follow-up questions:", followUpQuestions);
        if (!followUpQuestions || followUpQuestions.length < 3) {
          throw new Error("GPT did not return enough questions");
        }
      } catch (err) {
        console.error(
          "[ERROR] Failed to generate smart follow-up questions from GPT:",
          err
        );
        return res.status(500).json({
          success: false,
          message:
            "Failed to generate smart follow-up questions from GPT. Check your OpenAI API key, quota, or network.",
          error: err instanceof Error ? err.message : err,
        });
      }

      return res.json({
        success: true,
        result: aiResponse,
        followUpQuestions,
        timestamp: new Date().toISOString(),
        note: "AI-generated response",
      });
    } catch (error: any) {
      console.error("Error in guided analysis:", error);

      // Check if it's an OpenAI API error
      if (error?.response?.status === 401) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API key is invalid or expired",
          error: "Please check your OpenAI API key configuration",
        });
      } else if (error?.response?.status === 429) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API rate limit exceeded",
          error: "Please try again later",
        });
      } else if (
        error?.code === "ENOTFOUND" ||
        error?.code === "ECONNREFUSED"
      ) {
        return res.status(500).json({
          success: false,
          message: "Cannot connect to OpenAI API",
          error: "Please check your internet connection",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error?.response?.data || error.message || error,
      });
    }
  }
);

// --- Dedicated function for smart follow-up questions ---
async function generateSmartQuestions({
  carType,
  carModel,
  mileage,
  problemDescription,
}: {
  carType: string;
  carModel: string;
  mileage: string;
  problemDescription: string;
}) {
  const description = `نوع السيارة: ${carType}\nالموديل: ${carModel}\nالممشى: ${mileage}\nالمشكلة: ${problemDescription}`;
  const systemPrompt = `أنت مساعد ذكي متخصص في تشخيص مشاكل السيارات. بناءً على وصف مشكلة السيارة التالي، قم بتوليد 3 أسئلة متابعة ذكية باللغة العربية تساعد في توضيح المشكلة بشكل أكبر.\n\nوصف المشكلة:\n"{USER_DESCRIPTION}"\n\nهام:\n- لا تقدم أي تشخيص أو إجابة الآن.\n- فقط أعد 3 أسئلة متابعة ذكية باللغة العربية.\n- أعد الأسئلة كمصفوفة JSON من السلاسل النصية فقط، بدون أي شرح إضافي أو ترجمة.`;

  const messages: { role: "system" | "user"; content: string }[] = [
    {
      role: "system",
      content: systemPrompt.replace("{USER_DESCRIPTION}", description),
    },
    { role: "user", content: description },
  ];

  // @ts-ignore: OpenAI types may require 'name', but it's not needed for basic messages
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  console.log("[DEBUG] Raw GPT follow-up questions:", raw);

  // Try to extract questions as an array
  let questions: string[] = [];
  if (raw) {
    // Try to parse as JSON array
    try {
      if (raw.startsWith("[") && raw.endsWith("]")) {
        questions = JSON.parse(raw);
      } else {
        // Try to extract lines or numbered list
        const lines = raw
          .split(/\n|\r/)
          .filter((l: string) => l.trim())
          .map((l: string) => l.replace(/^\d+\.|^- /, "").trim());
        questions = lines.filter((q: string) => q.length > 0).slice(0, 3);
      }
    } catch (e) {
      console.error("[ERROR] Could not parse GPT follow-up questions:", e, raw);
      questions = raw
        .split(/\n|\r/)
        .filter((l: string) => l.trim())
        .map((l: string) => l.replace(/^\d+\.|^- /, "").trim())
        .filter((q: string) => q.length > 0)
        .slice(0, 3);
    }
  }
  // Return as array of {id, question, type}
  return questions.map((q: string, i: number) => ({
    id: (i + 1).toString(),
    question: q,
    type: "text",
  }));
}

// Follow-up analysis endpoint
app.post(
  "/api/analyze-followup",
  [
    body("initialAnalysis")
      .notEmpty()
      .withMessage("Initial analysis is required"),
    body("followUpAnswers")
      .isArray()
      .withMessage("Follow-up answers must be an array"),
    body("carDetails").notEmpty().withMessage("Car details are required"),
  ],
  async (req: express.Request, res: express.Response) => {
    console.log("=== /api/analyze-followup endpoint hit ===");
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

      const { initialAnalysis, followUpAnswers, carDetails, image } = req.body;

      console.log("Processing follow-up analysis request");

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.log(
          "[DEBUG] Fallback template response path used (no OpenAI key)"
        );

        const fallbackAnalysis = `
🚗 التحليل النهائي المحسن - الكويت

📋 معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم
${
  carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""
}

🔍 المشكلة الأصلية:
${carDetails.problemDescription}

✅ التحليل الأولي:
${initialAnalysis}

📝 الإجابات التفصيلية على الأسئلة الذكية:
${followUpAnswers
  .map((answer: any, index: number) => `السؤال ${index + 1}: ${answer.answer}`)
  .join("\n")}

🎯 التحليل النهائي المحسن:
بناءً على المعلومات التفصيلية المقدمة، يمكن تحديد المشكلة بدقة أكبر. 

🔧 التوصيات النهائية للكويت:
1. قم بفحص السيارة لدى ميكانيكي متخصص في الكويت
2. تأكد من صيانة السيارة الدورية
3. راقب أي أعراض إضافية
4. احتفظ بسجل الصيانة
5. خذ في الاعتبار الظروف المناخية في الكويت

💰 أسعار قطع الغيار المتوقعة (بالدينار الكويتي):
- سيتم تقدير الأسعار بالدينار الكويتي (د.ك) بعد التحليل التفصيلي
- الأسعار تعتمد على نوع السيارة: ${carDetails.carType} ${carDetails.carModel}

🏢 مراكز الصيانة المقترحة:
- سيتم اقتراح مراكز صيانة موثوقة في الكويت

💡 نصائح للوقاية:
1. قم بالصيانة الدورية كل 6 أشهر
2. راقب مستوى الزيت والماء بانتظام

⚠️ ملاحظة: هذا تحليل محسن بناءً على المعلومات التفصيلية. للحصول على تشخيص دقيق، استشر ميكانيكي محترف في الكويت.

🔧 للتحليل المتقدم: يرجى إضافة مفتاح OpenAI API في ملف .env
        `;

        return res.json({
          success: true,
          result: fallbackAnalysis.trim(),
          timestamp: new Date().toISOString(),
          note: "Fallback response - OpenAI API key not configured",
        });
      }

      // Compose the enhanced prompt in Arabic with Kuwait-specific pricing
      const prompt = `
أنت خبير ميكانيكي سيارات محترف في الكويت. بناءً على المعلومات التالية، قدم تحليلًا نهائيًا محسنًا ومفصلًا:

معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم
${
  carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""
}

المشكلة الأصلية:
${carDetails.problemDescription}

التحليل الأولي:
${initialAnalysis}

الإجابات التفصيلية على الأسئلة الذكية:
${followUpAnswers
  .map((answer: any, index: number) => `السؤال ${index + 1}: ${answer.answer}`)
  .join("\n")}

${image ? "ملاحظة: تم إرفاق صورة للمشكلة" : ""}

مهم جداً: استخدم الإجابات التفصيلية لتحسين التشخيص النهائي. لا تتجاهل هذه المعلومات.

يرجى تقديم:
1. تحليل نهائي محسن ومفصل للمشكلة بناءً على الإجابات التفصيلية
2. تشخيص دقيق ومحدث بناءً على جميع المعلومات المقدمة
3. توصيات عملية وخطوات العلاج المحددة
4. أسعار قطع الغيار المطلوبة بالدينار الكويتي (د.ك) - مثال: "سعر الدينمو لسيارة ${
        carDetails.carType
      } ${carDetails.carModel} في الكويت حوالي 45 د.ك"
5. تقدير تكلفة العمل في الكويت
6. اقتراح مراكز صيانة موثوقة في الكويت
7. نصائح للوقاية من المشاكل المستقبلية (اقتصر على نصيحتين فقط)

ملاحظات مهمة:
- استخدم الدينار الكويتي (د.ك) لجميع الأسعار
- اذكر أسعار قطع الغيار المحددة بناءً على نوع وموديل السيارة
- خذ في الاعتبار الظروف المناخية في الكويت
- اقترح مراكز صيانة معروفة في الكويت
- استخدم الإجابات التفصيلية لتحسين التشخيص

يجب أن يكون التحليل باللغة العربية ومفصلًا وواضحًا مع التركيز على السياق الكويتي.
      `;

      console.log("Calling OpenAI API for follow-up analysis...");

      // Call OpenAI GPT
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات محترف في الكويت مع خبرة 20+ سنة. قدم تحليلات دقيقة ومفصلة باللغة العربية. استخدم الدينار الكويتي (د.ك) لجميع الأسعار. اذكر نصيحتين فقط للوقاية.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse =
        completion.choices[0]?.message?.content?.trim() ||
        "لم يتم الحصول على تحليل من الذكاء الاصطناعي.";

      console.log("OpenAI API call successful for follow-up analysis");

      return res.json({
        success: true,
        result: aiResponse,
        timestamp: new Date().toISOString(),
        note: "AI-generated enhanced analysis",
      });
    } catch (error: any) {
      console.error("Error in follow-up analysis:", error);

      // Check if it's an OpenAI API error
      if (error?.response?.status === 401) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API key is invalid or expired",
          error: "Please check your OpenAI API key configuration",
        });
      } else if (error?.response?.status === 429) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API rate limit exceeded",
          error: "Please try again later",
        });
      } else if (
        error?.code === "ENOTFOUND" ||
        error?.code === "ECONNREFUSED"
      ) {
        return res.status(500).json({
          success: false,
          message: "Cannot connect to OpenAI API",
          error: "Please check your internet connection",
        });
      }

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
