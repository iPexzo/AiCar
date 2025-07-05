"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const express_validator_1 = require("express-validator");
const openai_1 = __importDefault(require("openai"));
dotenv_1.default.config();
console.log("Loaded OpenAI Key:", process.env.OPENAI_API_KEY?.slice(0, 12));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8001;
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  WARNING: OPENAI_API_KEY is not configured!");
    console.warn("   The AI analysis will use a fallback template response.");
    console.warn("   To enable real AI analysis, add your OpenAI API key to .env file");
}
console.log("=== Car AI Backend Server Starting ===");
console.log("=== CORS enabled for all origins ===");
app.use((0, cors_1.default)());
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
app.use("/api/analyze", analyze_1.default);
app.post("/api/analyze-guided", [
    (0, express_validator_1.body)("carType").notEmpty().withMessage("Car type is required"),
    (0, express_validator_1.body)("carModel").notEmpty().withMessage("Car model is required"),
    (0, express_validator_1.body)("mileage").notEmpty().withMessage("Mileage is required"),
    (0, express_validator_1.body)("problemDescription")
        .notEmpty()
        .withMessage("Problem description is required"),
], async (req, res) => {
    console.log("=== /api/analyze-guided endpoint hit ===");
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { carType, carModel, mileage, lastServiceType, problemDescription, } = req.body;
        if (!process.env.OPENAI_API_KEY) {
            console.log("[DEBUG] Fallback template response path used (no OpenAI key)");
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
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "أنت خبير ميكانيكي سيارات محترف." },
                { role: "user", content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
        });
        const aiResponse = completion.choices[0]?.message?.content?.trim() ||
            "لم يتم الحصول على تحليل من الذكاء الاصطناعي.";
        console.log("[DEBUG] OpenAI API call path used");
        console.log("OpenAI API call successful");
        let followUpQuestions = [];
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
        }
        catch (err) {
            console.error("[ERROR] Failed to generate smart follow-up questions from GPT:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to generate smart follow-up questions from GPT. Check your OpenAI API key, quota, or network.",
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
    }
    catch (error) {
        console.error("Error in guided analysis:", error);
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
async function generateSmartQuestions({ carType, carModel, mileage, problemDescription, }) {
    const description = `نوع السيارة: ${carType}\nالموديل: ${carModel}\nالممشى: ${mileage}\nالمشكلة: ${problemDescription}`;
    const systemPrompt = `أنت مساعد ذكي متخصص في تشخيص مشاكل السيارات. بناءً على وصف مشكلة السيارة التالي، قم بتوليد 3 أسئلة متابعة ذكية باللغة العربية تساعد في توضيح المشكلة بشكل أكبر.\n\nوصف المشكلة:\n"{USER_DESCRIPTION}"\n\nهام:\n- لا تقدم أي تشخيص أو إجابة الآن.\n- فقط أعد 3 أسئلة متابعة ذكية باللغة العربية.\n- أعد الأسئلة كمصفوفة JSON من السلاسل النصية فقط، بدون أي شرح إضافي أو ترجمة.`;
    const messages = [
        {
            role: "system",
            content: systemPrompt.replace("{USER_DESCRIPTION}", description),
        },
        { role: "user", content: description },
    ];
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 300,
        temperature: 0.7,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    console.log("[DEBUG] Raw GPT follow-up questions:", raw);
    let questions = [];
    if (raw) {
        try {
            if (raw.startsWith("[") && raw.endsWith("]")) {
                questions = JSON.parse(raw);
            }
            else {
                const lines = raw
                    .split(/\n|\r/)
                    .filter((l) => l.trim())
                    .map((l) => l.replace(/^\d+\.|^- /, "").trim());
                questions = lines.filter((q) => q.length > 0).slice(0, 3);
            }
        }
        catch (e) {
            console.error("[ERROR] Could not parse GPT follow-up questions:", e, raw);
            questions = raw
                .split(/\n|\r/)
                .filter((l) => l.trim())
                .map((l) => l.replace(/^\d+\.|^- /, "").trim())
                .filter((q) => q.length > 0)
                .slice(0, 3);
        }
    }
    return questions.map((q, i) => ({
        id: (i + 1).toString(),
        question: q,
        type: "text",
    }));
}
app.post("/api/analyze-followup", [
    (0, express_validator_1.body)("initialAnalysis")
        .notEmpty()
        .withMessage("Initial analysis is required"),
    (0, express_validator_1.body)("followUpAnswers")
        .isArray()
        .withMessage("Follow-up answers must be an array"),
    (0, express_validator_1.body)("carDetails").notEmpty().withMessage("Car details are required"),
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
        const { initialAnalysis, followUpAnswers, carDetails, image } = req.body;
        console.log("Processing follow-up analysis request");
        if (!process.env.OPENAI_API_KEY) {
            console.log("[DEBUG] Fallback template response path used (no OpenAI key)");
            const fallbackAnalysis = `
🚗 التحليل النهائي المحسن - الكويت

📋 معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم
${carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""}

🔍 المشكلة الأصلية:
${carDetails.problemDescription}

✅ التحليل الأولي:
${initialAnalysis}

📝 الإجابات التفصيلية على الأسئلة الذكية:
${followUpAnswers
                .map((answer, index) => `السؤال ${index + 1}: ${answer.answer}`)
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
        const prompt = `
أنت خبير ميكانيكي سيارات محترف في الكويت. بناءً على المعلومات التالية، قدم تحليلًا نهائيًا محسنًا ومفصلًا:

معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم
${carDetails.lastServiceType ? `- آخر صيانة: ${carDetails.lastServiceType}` : ""}

المشكلة الأصلية:
${carDetails.problemDescription}

التحليل الأولي:
${initialAnalysis}

الإجابات التفصيلية على الأسئلة الذكية:
${followUpAnswers
            .map((answer, index) => `السؤال ${index + 1}: ${answer.answer}`)
            .join("\n")}

${image ? "ملاحظة: تم إرفاق صورة للمشكلة" : ""}

مهم جداً: استخدم الإجابات التفصيلية لتحسين التشخيص النهائي. لا تتجاهل هذه المعلومات.

يرجى تقديم:
1. تحليل نهائي محسن ومفصل للمشكلة بناءً على الإجابات التفصيلية
2. تشخيص دقيق ومحدث بناءً على جميع المعلومات المقدمة
3. توصيات عملية وخطوات العلاج المحددة
4. أسعار قطع الغيار المطلوبة بالدينار الكويتي (د.ك) - مثال: "سعر الدينمو لسيارة ${carDetails.carType} ${carDetails.carModel} في الكويت حوالي 45 د.ك"
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
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "أنت خبير ميكانيكي سيارات محترف في الكويت مع خبرة 20+ سنة. قدم تحليلات دقيقة ومفصلة باللغة العربية. استخدم الدينار الكويتي (د.ك) لجميع الأسعار. اذكر نصيحتين فقط للوقاية.",
                },
                { role: "user", content: prompt },
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });
        const aiResponse = completion.choices[0]?.message?.content?.trim() ||
            "لم يتم الحصول على تحليل من الذكاء الاصطناعي.";
        console.log("OpenAI API call successful for follow-up analysis");
        return res.json({
            success: true,
            result: aiResponse,
            timestamp: new Date().toISOString(),
            note: "AI-generated enhanced analysis",
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
app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌐 LAN Access: http://0.0.0.0:${PORT}`);
    console.log(`🎯 Target endpoint: http://192.168.8.149:${PORT}/api/analyze-guided`);
});
exports.default = app;
//# sourceMappingURL=server.js.map