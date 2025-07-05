"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
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
router.post("/guided", (req, res) => {
    console.log("=== /api/analyze/guided endpoint hit (redirecting) ===");
    res.status(307).json({
        success: false,
        message: "This endpoint is deprecated. Please use /api/analyze-guided instead.",
        redirect: "/api/analyze-guided",
    });
});
exports.default = router;
//# sourceMappingURL=analyze.js.map