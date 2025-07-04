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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8001;
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
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", req.headers);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request IP:", req.ip);
    console.log("Request user agent:", req.get("User-Agent"));
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log("Validation errors:", errors.array());
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { carType, carModel, mileage, lastServiceType, problemDescription, } = req.body;
        console.log("Processing request for:", {
            carType,
            carModel,
            mileage,
            lastServiceType,
            problemDescription,
        });
        const analysis = `
🚗 تحليل مشكلة السيارة

📋 معلومات السيارة:
- النوع: ${carType}
- الموديل: ${carModel}
- الممشى: ${mileage} كم
${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}

🔍 المشكلة المذكورة:
${problemDescription}

✅ التحليل الأولي:
بناءً على المعلومات المقدمة، يبدو أن المشكلة تتطلب فحصاً دقيقاً. 

🔧 التوصيات:
1. قم بفحص السيارة لدى ميكانيكي متخصص
2. تأكد من صيانة السيارة الدورية
3. راقب أي أعراض إضافية

⚠️ ملاحظة: هذا تحليل أولي. للحصول على تشخيص دقيق، استشر ميكانيكي محترف.
      `;
        console.log("Sending response back to frontend");
        return res.json({
            success: true,
            result: analysis.trim(),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error in guided analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
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