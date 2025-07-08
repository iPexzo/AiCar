"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./apis/routes/index"));
const express_validator_1 = require("express-validator");
const openai_1 = __importDefault(require("openai"));
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
console.log("Loaded OpenAI Key:", process.env.OPENAI_API_KEY?.slice(0, 12));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST || "0.0.0.0";
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
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  WARNING: OPENAI_API_KEY is not configured!");
    console.warn("   The AI analysis will use a fallback template response.");
    console.warn("   To enable real AI analysis, add your OpenAI API key to .env file");
}
console.log("=== Car AI Backend Server Starting ===");
console.log("=== CORS enabled for all origins ===");
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Car AI Backend is running",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api", index_1.default);
async function checkAndKillPort(port) {
    return new Promise((resolve) => {
        console.log(`🔍 Checking if port ${port} is available...`);
        const killPort = (0, child_process_1.spawn)("npx", ["kill-port", port.toString()], {
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
                setTimeout(() => resolve(), 1000);
            }
            else {
                console.log(`⚠️  Port ${port} check completed (code: ${code})`);
                if (output)
                    console.log(`Output: ${output.trim()}`);
                if (errorOutput)
                    console.log(`Error: ${errorOutput.trim()}`);
                setTimeout(() => resolve(), 1000);
            }
        });
        killPort.on("error", (error) => {
            console.log(`⚠️  Error checking port: ${error.message}`);
            setTimeout(() => resolve(), 1000);
        });
    });
}
async function findAvailablePort(basePort, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const port = basePort + i;
        const isFree = await new Promise((resolve) => {
            const tester = net_1.default
                .createServer()
                .once("error", (err) => {
                if (err.code === "EADDRINUSE")
                    resolve(false);
                else
                    resolve(false);
            })
                .once("listening", () => {
                tester.close();
                resolve(true);
            })
                .listen(port, HOST);
        });
        if (isFree)
            return port;
    }
    throw new Error(`No available port found from ${basePort} to ${basePort + maxAttempts - 1}`);
}
const repairVideosPath = path_1.default.join(__dirname, "data", "repair-videos.json");
let repairVideos;
try {
    repairVideos = JSON.parse(fs_1.default.readFileSync(repairVideosPath, "utf8"));
}
catch (e) {
    console.error("Failed to load repair-videos.json:", e);
    repairVideos = [];
}
function normalizePartName(name) {
    return name
        .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
        .replace(/[.,\-()\[\]{}]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
function findVideoForPart(partName) {
    const normalized = normalizePartName(partName);
    for (const entry of repairVideos) {
        for (const synonym of entry.partNames) {
            if (normalized.includes(normalizePartName(synonym))) {
                return { videoUrl: entry.videoUrl, videoTitle: entry.videoTitle };
            }
        }
    }
    return { videoUrl: null, videoTitle: null };
}
async function handleAIDiagnosis(req, res) {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            success: false,
            message: "OpenAI API key not configured",
            error: "Please set OPENAI_API_KEY in your environment to enable AI analysis.",
        });
    }
    const { carType, carModel, mileage, lastServiceType, problemDescription, previousQuestions = [], previousAnswers = [], chatHistory = [], step, year, } = req.body;
    const carYear = year;
    let currentStep = step;
    if (!currentStep) {
        if (previousQuestions.length === 0 && previousAnswers.length === 0) {
            currentStep = "initial";
        }
        else if (previousQuestions.length < 3) {
            currentStep = "questions";
        }
        else {
            currentStep = "final";
        }
    }
    function buildHistorySection() {
        let historySection = "";
        if (chatHistory.length > 0) {
            historySection = "\n\nسجل المحادثة:";
            chatHistory.forEach((msg, i) => {
                historySection += `\n${msg}`;
            });
        }
        else if (previousQuestions.length > 0) {
            historySection = "\n\nسجل المحادثة:";
            previousQuestions.forEach((q, i) => {
                const answer = previousAnswers[i] || "(بدون إجابة)";
                historySection += `\nسؤال: ${q}\nإجابة المستخدم: ${answer}`;
            });
        }
        return historySection;
    }
    if (currentStep === "initial") {
        const historySection = buildHistorySection();
        const preliminaryPrompt = `\nأنت خبير ميكانيكي سيارات في الكويت. بناءً على وصف المشكلة التالي وسجل المحادثة السابق، قدم نظرة عامة أولية فقط عن المشكلة.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}\n${historySection}\n\nوصف المشكلة:\n${problemDescription}\n\nمطلوب منك:\n1. قدم تحليل أولي عام للمشكلة بناءً على المعلومات المتوفرة\n2. لا تذكر أسماء قطع غيار محددة\n3. لا تذكر أسعار أو تكاليف\n4. لا تقدم تعليمات إصلاح مفصلة\n5. لا تقترح مراكز صيانة محددة\n6. ركز فقط على فهم وتصنيف المشكلة بشكل عام\n7. استخدم اللغة العربية\n\nهذا تحليل أولي فقط. للحصول على تحليل مفصل مع أسماء القطع والأسعار، سيتم طرح أسئلة إضافية.`;
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "أنت خبير ميكانيكي سيارات في الكويت. قدم تحليلات أولية عامة.",
                    },
                    { role: "user", content: preliminaryPrompt },
                ],
                max_tokens: 600,
                temperature: 0.7,
            });
            const result = completion.choices[0]?.message?.content || "";
            const smartQuestionsPrompt = `أنت خبير ميكانيكي سيارات في الكويت. بناءً على المعلومات التالية:\n- نوع السيارة: ${carType}\n- الموديل: ${carModel}\n- سنة الصنع: ${carYear || "غير محددة"}\n- الممشى: ${mileage}\n- وصف المشكلة: ${problemDescription}\n- التحليل الأولي: ${result}\n\nاكتب 3 أسئلة ذكية ومحددة تساعدك على فهم المشكلة بشكل أعمق للوصول إلى أفضل حل.\n- ابدأ كل سؤال برقم (1. 2. 3.)\n- لا تكرر الأسئلة\n- اجعل الأسئلة متخصصة في المشكلة والسياق`;
            const questionsCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة والسياق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
                    },
                    { role: "user", content: smartQuestionsPrompt },
                ],
                max_tokens: 400,
                temperature: 0.8,
            });
            const questionsText = questionsCompletion.choices[0]?.message?.content?.trim() || "";
            let questionLines = questionsText
                .split("\n")
                .filter((line) => line.trim().match(/^\d+\./));
            if (questionLines.length === 0) {
                questionLines = questionsText
                    .split("\n")
                    .filter((line) => line.trim().length > 0);
            }
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
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "AI analysis failed",
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
    if (currentStep === "questions") {
        const historySection = buildHistorySection();
        const smartQuestionsPrompt = `أنت خبير ميكانيكي سيارات في الكويت. بناءً على وصف المشكلة وسجل المحادثة السابق، اطرح 3 أسئلة ذكية ومحددة لتحسين التشخيص.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}\n\nوصف المشكلة الأصلية:\n${problemDescription}\n\nسجل المحادثة السابق:\n${historySection}\n\nمعرف الجلسة: ${Date.now().toString() + Math.random().toString(36).substr(2, 9)}\nالوقت: ${new Date().toISOString()}\n\nمطلوب:\n1. اطرح 3 أسئلة ذكية ومحددة بناءً على المشكلة وسجل المحادثة\n2. لا تكرر الأسئلة السابقة - تأكد من أن الأسئلة الجديدة مختلفة تماماً\n3. استخدم سجل المحادثة لطرح أسئلة أكثر تحديداً وتفصيلاً\n4. استخدم اللغة العربية\n5. اكتب الأسئلة فقط، بدون أي شرح إضافي\n6. ابدأ كل سؤال برقم (1. 2. 3.)\n7. تأكد من أن الأسئلة الجديدة مخصصة للمشكلة والسياق\n8. ركز على جوانب مختلفة من المشكلة (أعراض، توقيت، ظروف، إلخ)\n9. إذا كانت المشكلة واضحة من سجل المحادثة، اطرح أسئلة أكثر تفصيلاً\n10. إذا لم تكن هناك معلومات كافية، اطرح أسئلة أساسية للحصول على مزيد من التفاصيل\n\nمثال على التنسيق المطلوب:\n1. هل لاحظت أي تغيير في استهلاك الوقود؟\n2. هل تظهر أي أضواء تحذيرية على لوحة العدادات؟\n3. هل المشكلة تظهر في جميع الظروف الجوية؟`;
        try {
            const questionsCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة وسجل المحادثة السابق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
                    },
                    { role: "user", content: smartQuestionsPrompt },
                ],
                max_tokens: 400,
                temperature: 0.8,
            });
            const questionsText = questionsCompletion.choices[0]?.message?.content?.trim() || "";
            const questionLines = questionsText
                .split("\n")
                .filter((line) => line.trim().match(/^\d+\./));
            const followUpQuestions = questionLines
                .map((line, index) => {
                const question = line.replace(/^\d+\.\s*/, "").trim();
                return {
                    id: (previousQuestions.length + index + 1).toString(),
                    question: question,
                    type: "text",
                    timestamp: new Date().toISOString(),
                };
            })
                .filter((q) => !previousQuestions.includes(q.question))
                .slice(0, 3 - previousQuestions.length);
            if (followUpQuestions.length > 0) {
                return res.json({
                    success: true,
                    result: "",
                    followUpQuestions,
                    timestamp: new Date().toISOString(),
                    note: "Smart follow-up questions generated",
                });
            }
            else {
                return res.json({
                    success: true,
                    result: "لا توجد أسئلة إضافية.",
                    followUpQuestions: [],
                    timestamp: new Date().toISOString(),
                    note: "No additional questions needed",
                });
            }
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate smart questions",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    if (currentStep === "final") {
        const historySection = buildHistorySection();
        const detailedPrompt = `\nأنت خبير ميكانيكي سيارات محترف في الكويت. بناءً على جميع المعلومات والإجابات التالية، قدم تحليلًا تقنيًا مفصلًا ومتقدمًا.\n\nمعلومات السيارة:\n- النوع: ${carType}\n- الموديل: ${carModel}\n- الممشى: ${mileage} كم\n${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}\n${historySection}\n\nوصف المشكلة الأصلية:\n${problemDescription}\n\nمطلوب منك:\n1. قدم تحليل تقني مفصل ومتقدم للمشكلة\n2. اذكر أسماء قطع الغيار المحددة المطلوبة\n3. قدم تقديرات أسعار دقيقة بالدينار الكويتي (د.ك)\n4. اذكر تعليمات الإصلاح المحددة والخطوات\n5. اقترح مراكز صيانة موثوقة في الكويت مع أسماء محددة\n6. خذ في الاعتبار الظروف المناخية في الكويت\n7. استخدم جميع المعلومات السابقة لتحسين التشخيص\n8. استخدم اللغة العربية\n\nهذا تحليل نهائي مفصل بناءً على جميع المعلومات المتوفرة.`;
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "أنت خبير ميكانيكي سيارات محترف في الكويت مع خبرة 20+ سنة. قدم تحليلات دقيقة ومفصلة باللغة العربية. استخدم الدينار الكويتي (د.ك) لجميع الأسعار. اذكر نصيحتين فقط للوقاية.",
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
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "AI analysis failed",
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
    return res.status(400).json({
        success: false,
        message: "Invalid step or insufficient data for analysis.",
    });
}
app.post("/api/analyze", [
    (0, express_validator_1.body)("carType").notEmpty().withMessage("Car type is required"),
    (0, express_validator_1.body)("carModel").notEmpty().withMessage("Car model is required"),
    (0, express_validator_1.body)("mileage").notEmpty().withMessage("Mileage is required"),
    (0, express_validator_1.body)("problemDescription")
        .notEmpty()
        .withMessage("Problem description is required"),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    return handleAIDiagnosis(req, res);
});
app.post("/api/analyze-guided", [
    (0, express_validator_1.body)("carType").notEmpty().withMessage("Car type is required"),
    (0, express_validator_1.body)("carModel").notEmpty().withMessage("Car model is required"),
    (0, express_validator_1.body)("mileage").notEmpty().withMessage("Mileage is required"),
    (0, express_validator_1.body)("problemDescription")
        .notEmpty()
        .withMessage("Problem description is required"),
], async (req, res) => {
    console.log("=== /api/analyze-guided endpoint hit ===");
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    return handleAIDiagnosis(req, res);
});
app.post("/api/generate-questions", [
    (0, express_validator_1.body)("carDetails").notEmpty().withMessage("Car details are required"),
    (0, express_validator_1.body)("problemDescription")
        .notEmpty()
        .withMessage("Problem description is required"),
    (0, express_validator_1.body)("previousQuestions")
        .isArray()
        .withMessage("Previous questions must be an array"),
    (0, express_validator_1.body)("previousAnswers")
        .isArray()
        .withMessage("Previous answers must be an array"),
    (0, express_validator_1.body)("chatHistory")
        .optional()
        .isArray()
        .withMessage("Chat history must be an array"),
], async (req, res) => {
    console.log("=== /api/generate-questions endpoint hit ===");
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { carDetails, problemDescription, previousQuestions, previousAnswers, chatHistory = [], } = req.body;
        console.log("Generating additional smart questions based on previous answers");
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "OpenAI API key not configured",
                error: "Please configure OpenAI API key for smart questions generation",
            });
        }
        const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        let fullChatHistory = "";
        if (chatHistory.length > 0) {
            fullChatHistory = "\n\nسجل المحادثة الكامل:";
            chatHistory.forEach((entry, index) => {
                fullChatHistory += `\n${index + 1}. ${entry.message || entry}`;
            });
        }
        let previousQASection = "";
        if (previousQuestions.length > 0) {
            previousQASection = "\n\nالأسئلة والإجابات السابقة:";
            previousQuestions.forEach((q, index) => {
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
${carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""}

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
        const questionsCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "أنت خبير ميكانيكي سيارات في الكويت. اطرح أسئلة ذكية ومحددة باللغة العربية بناءً على وصف المشكلة وسجل المحادثة السابق. تأكد من أن الأسئلة ديناميكية ومخصصة للسياق المحدد.",
                },
                { role: "user", content: additionalQuestionsPrompt },
            ],
            max_tokens: 300,
            temperature: 0.8,
        });
        const questionsText = questionsCompletion.choices[0]?.message?.content || "";
        let questionLines = questionsText
            .split("\n")
            .filter((line) => line.trim().match(/^\d+\./));
        if (questionLines.length === 0) {
            questionLines = questionsText
                .split("\n")
                .filter((line) => line.trim().length > 0);
        }
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
        console.log("Generated additional smart questions:", additionalQuestions.map((q) => q.question));
        return res.json({
            success: true,
            questions: additionalQuestions,
            timestamp: new Date().toISOString(),
            note: "AI-generated additional questions based on previous answers",
        });
    }
    catch (error) {
        console.error("Error generating additional questions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate additional questions",
            error: error?.message || "Unknown error",
        });
    }
});
app.post("/api/analyze-followup", [
    (0, express_validator_1.body)("initialAnalysis")
        .notEmpty()
        .withMessage("Initial analysis is required"),
    (0, express_validator_1.body)("followUpAnswers")
        .isArray()
        .withMessage("Follow-up answers must be an array"),
    (0, express_validator_1.body)("followUpQuestions")
        .isArray()
        .withMessage("Follow-up questions must be an array"),
    (0, express_validator_1.body)("carDetails").notEmpty().withMessage("Car details are required"),
    (0, express_validator_1.body)("image").optional().isBoolean().withMessage("Image must be a boolean"),
], async (req, res) => {
    console.log("=== /api/analyze-followup endpoint hit ===");
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { initialAnalysis, followUpAnswers, followUpQuestions, carDetails, image, } = req.body;
        console.log("Received carDetails:", carDetails);
        console.log("Received initialAnalysis:", initialAnalysis);
        console.log("Received followUpQuestions:", followUpQuestions);
        console.log("Received followUpAnswers:", followUpAnswers);
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
${Array.isArray(followUpQuestions) &&
            Array.isArray(followUpAnswers) &&
            followUpQuestions.length === followUpAnswers.length
            ? followUpQuestions
                .map((q, i) => `س${i + 1}: ${q.question}\nالإجابة: ${followUpAnswers[i]}`)
                .join("\n")
            : "لا توجد أسئلة متابعة أو إجابات متاحة."}

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
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "أنت خبير ميكانيكي سيارات محترف في الكويت مع خبرة 20+ سنة. قدم تحليلات دقيقة ومفصلة باللغة العربية. استخدم الدينار الكويتي (د.ك) لجميع الأسعار. اذكر نصيحتين فقط للوقاية.",
                },
                { role: "user", content: detailedPrompt },
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });
        async function addVideoLinksToRepairInstructions(aiText) {
            const sectionMatch = aiText.match(/(🔧 تعليمات الإصلاح[\s\S]*?)(?=\n[A-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]|$)/);
            const repairInstructionsWithVideos = [];
            if (!sectionMatch) {
                return { text: aiText, repairInstructionsWithVideos };
            }
            const section = sectionMatch[1];
            const lines = section
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.match(/^(\d+|[١-٩][٠-٩]*)[\.|\-]/));
            if (!lines.length) {
                return { text: aiText, repairInstructionsWithVideos };
            }
            const car = carDetails;
            const updatedLines = await Promise.all(lines.map(async (line, index) => {
                const stepText = line
                    .replace(/^(\d+|[١-٩][٠-٩]*)[\.|\-]\s*/, "")
                    .trim();
                console.log(`[VideoLink] Processing repair step ${index + 1}: '${stepText}'`);
                let videoUrl = null;
                let videoTitle = null;
                try {
                    const { searchCarRepairVideos } = await Promise.resolve().then(() => __importStar(require("./utils/enhancedVideoSearch")));
                    const searchResult = await searchCarRepairVideos(stepText, car);
                    if (searchResult.success && searchResult.videos.length > 0) {
                        const video = searchResult.videos[0];
                        videoUrl = video.url;
                        videoTitle = video.title;
                        console.log(`[VideoLink] ✅ Found video for step '${stepText}': ${videoTitle}`);
                    }
                    else {
                        const searchQuery = `${car.year}_${car.brand}_${car.model} ${stepText}`;
                        console.log(`[VideoLink] Trying CarCareKiosk for step: '${stepText}' (query: '${searchQuery}')`);
                        const resp = await axios_1.default.post("http://localhost:8001/api/car-care-kiosk/search", { searchQuery, baseURL: "https://carcarekiosk.com" }, { timeout: 10000 });
                        if (resp.data &&
                            resp.data.videos &&
                            resp.data.videos.length > 0) {
                            for (const video of resp.data.videos) {
                                try {
                                    const head = await axios_1.default.head(video.url, {
                                        timeout: 5000,
                                    });
                                    if (head.status === 200) {
                                        videoUrl = video.url;
                                        videoTitle = video.title;
                                        console.log(`[VideoLink] ✅ Found CarCareKiosk video for step: '${stepText}' → ${videoTitle}`);
                                        break;
                                    }
                                }
                                catch (err) {
                                    console.log(`[VideoLink] ❌ Error checking video link: ${video.url}`, err?.message || err);
                                }
                            }
                        }
                    }
                    if (!videoUrl) {
                        console.log(`[VideoLink] ❌ No video found for step: '${stepText}'`);
                    }
                }
                catch (err) {
                    console.log(`[VideoLink] ❌ Error searching for video for step: '${stepText}'`, err?.message || err);
                }
                repairInstructionsWithVideos.push({
                    step: stepText,
                    videoUrl,
                    videoTitle,
                });
                if (videoUrl) {
                    return `${line} 🔗 [شاهد الفيديو](${videoUrl})`;
                }
                return line;
            }));
            const newSection = [section.split("\n")[0], ...updatedLines].join("\n");
            const updatedText = aiText.replace(section, newSection);
            return { text: updatedText, repairInstructionsWithVideos };
        }
        const aiResponse = completion.choices[0]?.message?.content?.trim() ||
            "لم يتم الحصول على تحليل من الذكاء الاصطناعي.";
        const { text: finalResult, repairInstructionsWithVideos } = await addVideoLinksToRepairInstructions(aiResponse);
        function parseRequiredParts(aiText) {
            console.log("[DEBUG] Parsing required parts from AI response...");
            const sectionStart = aiText.indexOf("🧩 قطع الغيار المطلوبة");
            if (sectionStart === -1) {
                console.log("[DEBUG] Section header not found");
                return [];
            }
            const remainingText = aiText.substring(sectionStart);
            const nextSectionMatch = remainingText.match(/\n[📍🔍💵🔧🧰✅]/);
            const sectionEnd = nextSectionMatch
                ? nextSectionMatch.index
                : remainingText.length;
            const section = remainingText.substring(0, sectionEnd);
            const lines = section.split("\n").filter((line) => {
                const trimmed = line.trim();
                const isNumbered = /^\d+\.\s/.test(trimmed);
                const isDashed = /^-\s/.test(trimmed);
                return isNumbered || isDashed;
            });
            return lines.map((line) => {
                return line.replace(/^(\d+\.\s*|-\s*)/, "").trim();
            });
        }
        const requiredParts = parseRequiredParts(aiResponse);
        console.log("[DEBUG] Extracted required parts:", requiredParts);
        console.log("[DEBUG] Repair instructions with videos:", repairInstructionsWithVideos);
        console.log("OpenAI API call successful for follow-up analysis");
        return res.json({
            success: true,
            result: finalResult,
            requiredParts,
            repairInstructionsWithVideos,
            timestamp: new Date().toISOString(),
            note: "AI-generated enhanced analysis with repair instruction videos",
        });
    }
    catch (error) {
        console.error("Error in follow-up analysis:", error);
        if (error?.response?.status === 401) {
            return res.status(500).json({
                success: false,
                message: "OpenAI API key is invalid or expired",
                error: "Please check your OpenAI API key configuration",
            });
        }
        else if (error?.response?.status === 429) {
            return res.status(500).json({
                success: false,
                message: "OpenAI API rate limit exceeded",
                error: "Please try again later",
            });
        }
        else if (error?.code === "ENOTFOUND" ||
            error?.code === "ECONNREFUSED") {
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
});
app.use("*", (req, res) => {
    console.log(`[DEBUG] 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});
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
                    console.log(`⚠️  Port ${basePort} was in use. Started server on next available port: ${port}`);
                }
                else {
                    console.log(`🚀 Server running on ${HOST}:${port}`);
                }
                console.log(`📊 Health check: http://localhost:${port}/health`);
                console.log(`🔗 API Base URL: http://localhost:${port}/api`);
                console.log(`🌐 LAN Access: http://${HOST}:${port}`);
                console.log(`🎯 Target endpoint: http://192.168.8.149:${port}/api/analyze-guided`);
            });
            serverStarted = true;
            process.env.PORT = port.toString();
        }
        catch (err) {
            if (err.code === "EADDRINUSE") {
                console.log(`⚠️  Port ${port} in use, trying next port...`);
                port++;
                attempts++;
            }
            else {
                console.error("❌ Failed to start server:", err);
                break;
            }
        }
    }
    if (!serverStarted) {
        console.error(`❌ Could not start server on any port from ${basePort} to ${basePort + maxAttempts - 1}`);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map