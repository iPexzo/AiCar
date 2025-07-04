"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Analyze route is working!",
        timestamp: new Date().toISOString(),
    });
});
router.post("/test-post", (req, res) => {
    console.log("=== /api/analyze/test-post endpoint hit ===");
    res.json({
        success: true,
        message: "POST request works!",
        body: req.body,
        timestamp: new Date().toISOString(),
    });
});
router.get("/guided", (req, res) => {
    console.log("=== /api/analyze/guided GET endpoint hit ===");
    res.json({
        success: true,
        message: "GET /guided works!",
        timestamp: new Date().toISOString(),
    });
});
router.post("/guided", [
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
exports.default = router;
//# sourceMappingURL=analyze.js.map