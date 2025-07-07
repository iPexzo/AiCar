import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./apis/routes/index";
import { body, validationResult } from "express-validator";
import OpenAI from "openai";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import net from "net";

// Load environment variables
dotenv.config();
console.log("Loaded OpenAI Key:", process.env.OPENAI_API_KEY?.slice(0, 12));

const app = express();
const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST || "0.0.0.0";

// Enhanced CORS configuration for simulators
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:19006",
    "exp://localhost:19000",
    "exp://192.168.8.149:19000",
    "http://10.0.2.2:8001",
    "http://10.0.2.2:3000",
    "http://10.0.2.2:8081",
    "http://10.0.2.2:8082",
    "http://192.168.8.149:8001",
    "http://192.168.8.149:3000",
    "http://192.168.8.149:8081",
    "http://192.168.8.149:8082",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

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

// Enable CORS with enhanced configuration for simulators
app.use(cors(corsOptions));

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

// Instead, use the consolidated router:
app.use("/api", apiRouter);

// Port checking and process management
async function checkAndKillPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    console.log(`🔍 Checking if port ${port} is available...`);

    // Use kill-port package for more reliable port management
    const killPort = spawn("npx", ["kill-port", port.toString()], {
      shell: true,
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    killPort.stdout.on("data", (data) => {
      output += data.toString();
    });

    killPort.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    killPort.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Port ${port} is now available`);
        // Wait a bit for the port to be fully released
        setTimeout(() => resolve(), 1000);
      } else {
        // Even if kill-port fails, we'll try to start the server anyway
        console.log(`⚠️  Port ${port} check completed (code: ${code})`);
        if (output) console.log(`Output: ${output.trim()}`);
        if (errorOutput) console.log(`Error: ${errorOutput.trim()}`);
        setTimeout(() => resolve(), 1000);
      }
    });

    killPort.on("error", (error) => {
      console.log(`⚠️  Error checking port: ${error.message}`);
      setTimeout(() => resolve(), 1000);
    });
  });
}

// Utility to find the first available port starting from basePort
async function findAvailablePort(
  basePort: number,
  maxAttempts = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = net
        .createServer()
        .once("error", (err: any) => {
          if (err.code === "EADDRINUSE") resolve(false);
          else resolve(false);
        })
        .once("listening", () => {
          tester.close();
          resolve(true);
        })
        .listen(port, HOST);
    });
    if (isFree) return port;
  }
  throw new Error(
    `No available port found from ${basePort} to ${basePort + maxAttempts - 1}`
  );
}

// Refactored handleAIDiagnosis for 3-step flow
async function handleAIDiagnosis(req: express.Request, res: express.Response) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "OpenAI API key not configured",
      error:
        "Please set OPENAI_API_KEY in your environment to enable AI analysis.",
    });
  }

  const {
    carType,
    carModel,
    mileage,
    lastServiceType,
    problemDescription,
    previousQuestions = [],
    previousAnswers = [],
    chatHistory = [],
    step,
    year,
  } = req.body;

  const carYear = year;

  // Step auto-detection if not provided
  let currentStep = step;
  if (!currentStep) {
    if (previousQuestions.length === 0 && previousAnswers.length === 0) {
      currentStep = "initial";
    } else if (previousQuestions.length < 3) {
      currentStep = "questions";
    } else {
      currentStep = "final";
    }
  }

  // Helper: Build chat history section
  function buildHistorySection() {
    let historySection = "";
    if (chatHistory.length > 0) {
      historySection = "\n\nسجل المحادثة:";
      chatHistory.forEach((msg: string, i: number) => {
        historySection += `\n${msg}`;
      });
    } else if (previousQuestions.length > 0) {
      historySection = "\n\nسجل المحادثة:";
      previousQuestions.forEach((q: string, i: number) => {
        const answer = previousAnswers[i] || "(بدون إجابة)";
        historySection += `\nسؤال: ${q}\nإجابة المستخدم: ${answer}`;
      });
    }
    return historySection;
  }

  // Step 1: Initial analysis + Generate initial smart questions
  if (currentStep === "initial") {
    const historySection = buildHistorySection();
    const preliminaryPrompt = `\nأنت خبير ميكانيكي سيارات في الكويت. بناءً على وصف المشكلة التالي وسجل المحادثة السابق، قدم نظرة عامة أولية فقط عن المشكلة.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${
      lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""
    }\n${historySection}\n\nوصف المشكلة:\n${problemDescription}\n\nمطلوب منك:\n1. قدم تحليل أولي عام للمشكلة بناءً على المعلومات المتوفرة\n2. لا تذكر أسماء قطع غيار محددة\n3. لا تذكر أسعار أو تكاليف\n4. لا تقدم تعليمات إصلاح مفصلة\n5. لا تقترح مراكز صيانة محددة\n6. ركز فقط على فهم وتصنيف المشكلة بشكل عام\n7. استخدم اللغة العربية\n\nهذا تحليل أولي فقط. للحصول على تحليل مفصل مع أسماء القطع والأسعار، سيتم طرح أسئلة إضافية.`;

    try {
      // Get preliminary analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات في الكويت. قدم تحليلات أولية عامة.",
          },
          { role: "user", content: preliminaryPrompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      });
      const result = completion.choices[0]?.message?.content || "";

      // Generate initial smart questions, using the initial analysis as context
      const smartQuestionsPrompt = `أنت خبير ميكانيكي سيارات في الكويت. بناءً على المعلومات التالية:\n- نوع السيارة: ${carType}\n- الموديل: ${carModel}\n- سنة الصنع: ${
        carYear || "غير محددة"
      }\n- الممشى: ${mileage}\n- وصف المشكلة: ${problemDescription}\n- التحليل الأولي: ${result}\n\nاكتب 3 أسئلة ذكية ومحددة تساعدك على فهم المشكلة بشكل أعمق للوصول إلى أفضل حل.\n- ابدأ كل سؤال برقم (1. 2. 3.)\n- لا تكرر الأسئلة\n- اجعل الأسئلة متخصصة في المشكلة والسياق`;

      const questionsCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة والسياق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
          },
          { role: "user", content: smartQuestionsPrompt },
        ],
        max_tokens: 400,
        temperature: 0.8,
      });
      const questionsText =
        questionsCompletion.choices[0]?.message?.content?.trim() || "";

      // Parse up to 3 questions from the response
      let questionLines = questionsText
        .split("\n")
        .filter((line) => line.trim().match(/^\d+\./));

      // If no numbered questions, fallback to any non-empty lines
      if (questionLines.length === 0) {
        questionLines = questionsText
          .split("\n")
          .filter((line) => line.trim().length > 0);
      }

      // If still empty, force generic questions
      const genericQuestions = [
        "هل لاحظت أي تغييرات في أداء السيارة مؤخرًا؟",
        "هل تظهر أي أضواء تحذيرية على لوحة العدادات؟",
        "هل المشكلة تحدث في ظروف معينة فقط؟",
      ];
      if (questionLines.length === 0) {
        questionLines = genericQuestions.slice();
      }
      while (questionLines.length < 3) {
        questionLines.push(genericQuestions[questionLines.length]);
      }

      const followUpQuestions = questionLines
        .slice(0, 3)
        .map((line, index) => ({
          id: (index + 1).toString(),
          question: line.replace(/^\d+\.\s*/, "").trim(),
          type: "text",
          timestamp: new Date().toISOString(),
        }));

      console.log("Returning followUpQuestions:", followUpQuestions);

      return res.json({
        success: true,
        result: result.trim(),
        followUpQuestions,
        timestamp: new Date().toISOString(),
        note: "Preliminary analysis completed with smart questions",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "AI analysis failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Step 2: Generate 3 dynamic smart questions
  if (currentStep === "questions") {
    const historySection = buildHistorySection();
    const smartQuestionsPrompt = `أنت خبير ميكانيكي سيارات في الكويت. بناءً على وصف المشكلة وسجل المحادثة السابق، اطرح 3 أسئلة ذكية ومحددة لتحسين التشخيص.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${
      lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""
    }\n\nوصف المشكلة الأصلية:\n${problemDescription}\n\nسجل المحادثة السابق:\n${historySection}\n\nمعرف الجلسة: ${
      Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }\nالوقت: ${new Date().toISOString()}\n\nمطلوب:\n1. اطرح 3 أسئلة ذكية ومحددة بناءً على المشكلة وسجل المحادثة\n2. لا تكرر الأسئلة السابقة - تأكد من أن الأسئلة الجديدة مختلفة تماماً\n3. استخدم سجل المحادثة لطرح أسئلة أكثر تحديداً وتفصيلاً\n4. استخدم اللغة العربية\n5. اكتب الأسئلة فقط، بدون أي شرح إضافي\n6. ابدأ كل سؤال برقم (1. 2. 3.)\n7. تأكد من أن الأسئلة الجديدة مخصصة للمشكلة والسياق\n8. ركز على جوانب مختلفة من المشكلة (أعراض، توقيت، ظروف، إلخ)\n9. إذا كانت المشكلة واضحة من سجل المحادثة، اطرح أسئلة أكثر تفصيلاً\n10. إذا لم تكن هناك معلومات كافية، اطرح أسئلة أساسية للحصول على مزيد من التفاصيل\n\nمثال على التنسيق المطلوب:\n1. هل لاحظت أي تغيير في استهلاك الوقود؟\n2. هل تظهر أي أضواء تحذيرية على لوحة العدادات؟\n3. هل المشكلة تظهر في جميع الظروف الجوية؟`;
    try {
      const questionsCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة وسجل المحادثة السابق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
          },
          { role: "user", content: smartQuestionsPrompt },
        ],
        max_tokens: 400,
        temperature: 0.8,
      });
      const questionsText =
        questionsCompletion.choices[0]?.message?.content?.trim() || "";
      // Parse up to 3 unique, new questions from the response
      const questionLines = questionsText
        .split("\n")
        .filter((line) => line.trim().match(/^\d+\./));
      const followUpQuestions = questionLines
        .map((line: string, index: number) => {
          const question = line.replace(/^\d+\.\s*/, "").trim();
          return {
            id: (previousQuestions.length + index + 1).toString(),
            question: question,
            type: "text",
            timestamp: new Date().toISOString(),
          };
        })
        .filter(
          (q: { question: string }) => !previousQuestions.includes(q.question)
        )
        .slice(0, 3 - previousQuestions.length);
      if (followUpQuestions.length > 0) {
        return res.json({
          success: true,
          result: "",
          followUpQuestions,
          timestamp: new Date().toISOString(),
          note: "Smart follow-up questions generated",
        });
      } else {
        return res.json({
          success: true,
          result: "لا توجد أسئلة إضافية.",
          followUpQuestions: [],
          timestamp: new Date().toISOString(),
          note: "No additional questions needed",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate smart questions",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Step 3: Final detailed analysis
  if (currentStep === "final") {
    const historySection = buildHistorySection();
    const detailedPrompt = `\nأنت خبير ميكانيكي سيارات محترف في الكويت. بناءً على جميع المعلومات والإجابات التالية، قدم تحليلًا تقنيًا مفصلًا ومتقدمًا.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${
      lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""
    }\n${historySection}\n\nوصف المشكلة الأصلية:\n${problemDescription}\n\nمطلوب منك:\n1. قدم تحليل تقني مفصل ومتقدم للمشكلة\n2. اذكر أسماء قطع الغيار المحددة المطلوبة\n3. قدم تقديرات أسعار دقيقة بالدينار الكويتي (د.ك)\n4. اذكر تعليمات الإصلاح المحددة والخطوات\n5. اقترح مراكز صيانة موثوقة في الكويت مع أسماء محددة\n6. خذ في الاعتبار الظروف المناخية في الكويت\n7. استخدم جميع المعلومات السابقة لتحسين التشخيص\n8. استخدم اللغة العربية\n\nهذا تحليل نهائي مفصل بناءً على جميع المعلومات المتوفرة.`;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات محترف في الكويت مع خبرة 20+ سنة. قدم تحليلات دقيقة ومفصلة باللغة العربية. استخدم الدينار الكويتي (د.ك) لجميع الأسعار. اذكر نصيحتين فقط للوقاية.",
          },
          { role: "user", content: detailedPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      const result = completion.choices[0]?.message?.content || "";
      return res.json({
        success: true,
        result: result.trim(),
        followUpQuestions: [],
        timestamp: new Date().toISOString(),
        note: "AI-generated enhanced analysis",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "AI analysis failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Fallback: unknown step
  return res.status(400).json({
    success: false,
    message: "Invalid step or insufficient data for analysis.",
  });
}

// Proxy /api/analyze to /api/analyze-guided for compatibility
app.post(
  "/api/analyze",
  [
    body("carType").notEmpty().withMessage("Car type is required"),
    body("carModel").notEmpty().withMessage("Car model is required"),
    body("mileage").notEmpty().withMessage("Mileage is required"),
    body("problemDescription")
      .notEmpty()
      .withMessage("Problem description is required"),
  ],
  async (req: express.Request, res: express.Response) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    return handleAIDiagnosis(req, res);
  }
);

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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    return handleAIDiagnosis(req, res);
  }
);

// Generate additional smart follow-up questions
app.post(
  "/api/generate-questions",
  [
    body("carDetails").notEmpty().withMessage("Car details are required"),
    body("problemDescription")
      .notEmpty()
      .withMessage("Problem description is required"),
    body("previousQuestions")
      .isArray()
      .withMessage("Previous questions must be an array"),
    body("previousAnswers")
      .isArray()
      .withMessage("Previous answers must be an array"),
    body("chatHistory")
      .optional()
      .isArray()
      .withMessage("Chat history must be an array"),
  ],
  async (req: express.Request, res: express.Response) => {
    console.log("=== /api/generate-questions endpoint hit ===");
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
        carDetails,
        problemDescription,
        previousQuestions,
        previousAnswers,
        chatHistory = [],
      } = req.body;

      console.log(
        "Generating additional smart questions based on previous answers"
      );

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API key not configured",
          error:
            "Please configure OpenAI API key for smart questions generation",
        });
      }

      // Create dynamic prompt combining problemDescription and chatHistory
      const sessionId =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Build comprehensive chat history
      let fullChatHistory = "";
      if (chatHistory.length > 0) {
        fullChatHistory = "\n\nسجل المحادثة الكامل:";
        chatHistory.forEach((entry: any, index: number) => {
          fullChatHistory += `\n${index + 1}. ${entry.message || entry}`;
        });
      }

      // Build previous Q&A section
      let previousQASection = "";
      if (previousQuestions.length > 0) {
        previousQASection = "\n\nالأسئلة والإجابات السابقة:";
        previousQuestions.forEach((q: any, index: number) => {
          const answer = previousAnswers[index] || "(بدون إجابة)";
          previousQASection += `\nسؤال: ${q.question || q}\nإجابة: ${answer}`;
        });
      }

      const additionalQuestionsPrompt = `
أنت خبير ميكانيكي سيارات في الكويت. بناءً على وصف المشكلة وسجل المحادثة الكامل، اطرح 3 أسئلة ذكية ومحددة لتحسين التشخيص.

معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم
${
  carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""
}

المشكلة الأصلية:
${problemDescription}${fullChatHistory}${previousQASection}

معرف الجلسة: ${sessionId}
الوقت: ${new Date().toISOString()}

مطلوب:
1. اطرح 3 أسئلة ذكية ومحددة بناءً على المشكلة وسجل المحادثة
2. لا تكرر الأسئلة السابقة - تأكد من أن الأسئلة الجديدة مختلفة تماماً
3. استخدم سجل المحادثة والإجابات السابقة لطرح أسئلة أكثر تحديداً وتفصيلاً
4. استخدم اللغة العربية
5. اكتب الأسئلة فقط، بدون أي شرح إضافي
6. ابدأ كل سؤال برقم (1. 2. 3.)
7. تأكد من أن الأسئلة الجديدة مخصصة للمشكلة والسياق
8. ركز على جوانب مختلفة من المشكلة (أعراض، توقيت، ظروف، إلخ)
9. إذا كانت المشكلة واضحة من سجل المحادثة، اطرح أسئلة أكثر تفصيلاً
10. إذا لم تكن هناك معلومات كافية، اطرح أسئلة أساسية للحصول على مزيد من التفاصيل

مثال على التنسيق المطلوب:
1. هل لاحظت أي تغيير في استهلاك الوقود؟
2. هل تظهر أي أضواء تحذيرية على لوحة العدادات؟
3. هل المشكلة تظهر في جميع الظروف الجوية؟`;

      // Generate additional questions using OpenAI
      const questionsCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة وسجل المحادثة السابق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
          },
          { role: "user", content: additionalQuestionsPrompt },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const questionsText =
        questionsCompletion.choices[0]?.message?.content || "";

      // Parse the questions from the response
      let questionLines = questionsText
        .split("\n")
        .filter((line) => line.trim().match(/^\d+\./));

      // If no numbered questions, fallback to any non-empty lines
      if (questionLines.length === 0) {
        questionLines = questionsText
          .split("\n")
          .filter((line) => line.trim().length > 0);
      }

      // If still empty, force generic questions
      const genericQuestions = [
        "هل لاحظت أي تغييرات في أداء السيارة مؤخرًا؟",
        "هل تظهر أي أضواء تحذيرية على لوحة العدادات؟",
        "هل المشكلة تحدث في ظروف معينة فقط؟",
      ];
      if (questionLines.length === 0) {
        questionLines = genericQuestions.slice();
      }
      while (questionLines.length < 3) {
        questionLines.push(genericQuestions[questionLines.length]);
      }

      const additionalQuestions = questionLines
        .slice(0, 3)
        .map((line, index) => {
          const question = line.replace(/^\d+\.\s*/, "").trim();
          return {
            id: (previousQuestions.length + index + 1).toString(),
            question: question,
            type: "text",
            timestamp: new Date().toISOString(),
          };
        });

      console.log(
        "Generated additional smart questions:",
        additionalQuestions.map((q) => q.question)
      );

      return res.json({
        success: true,
        questions: additionalQuestions,
        timestamp: new Date().toISOString(),
        note: "AI-generated additional questions based on previous answers",
      });
    } catch (error: any) {
      console.error("Error generating additional questions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate additional questions",
        error: error?.message || "Unknown error",
      });
    }
  }
);

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
    body("followUpQuestions")
      .isArray()
      .withMessage("Follow-up questions must be an array"),
    body("carDetails").notEmpty().withMessage("Car details are required"),
    body("image").optional().isBoolean().withMessage("Image must be a boolean"),
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

      const {
        initialAnalysis,
        followUpAnswers,
        followUpQuestions,
        carDetails,
        image,
      } = req.body;

      // Log all received inputs for debugging
      console.log("Received carDetails:", carDetails);
      console.log("Received initialAnalysis:", initialAnalysis);
      console.log("Received followUpQuestions:", followUpQuestions);
      console.log("Received followUpAnswers:", followUpAnswers);

      // Compose the detailed analysis prompt in Arabic with Kuwait-specific pricing
      const detailedPrompt = `
أنت خبير ميكانيكي سيارات محترف في الكويت. بناءً على جميع المعلومات التالية، قدم تحليلًا نهائيًا مفصلًا ومتقدمًا:

معلومات السيارة:
- النوع: ${carDetails.brand}
- الموديل: ${carDetails.model}
- السنة: ${carDetails.year}
- الممشى: ${carDetails.mileage} كم

وصف المشكلة:
${carDetails.problemDescription}

التحليل الأولي:
${initialAnalysis}

الأسئلة الذكية وإجابات المستخدم:
${
  Array.isArray(followUpQuestions) &&
  Array.isArray(followUpAnswers) &&
  followUpQuestions.length === followUpAnswers.length
    ? followUpQuestions
        .map(
          (q, i) => `س${i + 1}: ${q.question}\nالإجابة: ${followUpAnswers[i]}`
        )
        .join("\n")
    : "لا توجد أسئلة متابعة أو إجابات متاحة."
}

مطلوب منك:
1. ابدأ بمقدمة عن السيارة (اذكر النوع والموديل والسنة)
2. قدم ملخص التشخيص النهائي بناءً على كل ما سبق
3. حدد قطع الغيار المطلوبة بدقة
4. قدم تقديرات أسعار دقيقة بالدينار الكويتي (د.ك) حسب نوع وموديل السيارة
5. اذكر تعليمات الإصلاح والخطوات التفصيلية
6. اقترح مراكز صيانة موثوقة في الكويت
7. قدم نصيحتين فقط للوقاية من المشاكل المستقبلية
8. استخدم اللغة العربية الواضحة

صيغة الإخراج:
---
📍 مقدمة السيارة
🔍 ملخص التشخيص
🧩 قطع الغيار المطلوبة
💵 الأسعار (حسب الموديل)
🔧 تعليمات الإصلاح
🧰 مراكز الصيانة
✅ نصائح وقائية
---

استخدم جميع المعلومات السابقة لتحسين التشخيص وجعل التحليل واقعيًا وشخصيًا.
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
          { role: "user", content: detailedPrompt },
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

// Robust server start: try ports until one is free, never crash on EADDRINUSE
async function startServer() {
  const basePort = Number(process.env.PORT) || 8001;
  const maxAttempts = 10;
  let port = basePort;
  let attempts = 0;
  let serverStarted = false;

  while (!serverStarted && attempts < maxAttempts) {
    try {
      const server = app.listen(port, HOST, () => {
        if (port !== basePort) {
          console.log(
            `⚠️  Port ${basePort} was in use. Started server on next available port: ${port}`
          );
        } else {
          console.log(`🚀 Server running on ${HOST}:${port}`);
        }
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`🔗 API Base URL: http://localhost:${port}/api`);
        console.log(`🌐 LAN Access: http://${HOST}:${port}`);
        console.log(
          `🎯 Target endpoint: http://192.168.8.149:${port}/api/analyze-guided`
        );
      });
      // If we get here, server started successfully
      serverStarted = true;
      process.env.PORT = port.toString();
    } catch (err: any) {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️  Port ${port} in use, trying next port...`);
        port++;
        attempts++;
      } else {
        console.error("❌ Failed to start server:", err);
        break;
      }
    }
  }
  if (!serverStarted) {
    console.error(
      `❌ Could not start server on any port from ${basePort} to ${
        basePort + maxAttempts - 1
      }`
    );
  }
}

startServer();

export default app;
