"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const CarAnalysis_1 = require("../models/CarAnalysis");
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const analyses = await CarAnalysis_1.CarAnalysis.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.json({
            success: true,
            data: analyses,
        });
    }
    catch (error) {
        console.error("Error fetching analyses:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
router.get("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const analysis = await CarAnalysis_1.CarAnalysis.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found",
            });
        }
        return res.json({
            success: true,
            data: analysis,
        });
    }
    catch (error) {
        console.error("Error fetching analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
router.post("/", [auth_1.authenticateToken, upload_1.upload.array("images", 5), upload_1.handleUploadError], [
    (0, express_validator_1.body)("carDetails.brand").notEmpty().withMessage("Car brand is required"),
    (0, express_validator_1.body)("carDetails.model").notEmpty().withMessage("Car model is required"),
    (0, express_validator_1.body)("carDetails.year")
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Valid car year is required"),
    (0, express_validator_1.body)("carDetails.engineType")
        .isIn(["gasoline", "diesel", "hybrid", "electric", "other"])
        .withMessage("Valid engine type is required"),
    (0, express_validator_1.body)("carDetails.transmission")
        .isIn(["manual", "automatic", "cvt", "other"])
        .withMessage("Valid transmission type is required"),
    (0, express_validator_1.body)("carDetails.mileage")
        .isInt({ min: 0 })
        .withMessage("Valid mileage is required"),
    (0, express_validator_1.body)("problemDescription")
        .isLength({ min: 10 })
        .withMessage("Problem description must be at least 10 characters long"),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { carDetails, problemDescription } = req.body;
        const images = req.files ? req.files.map((file) => file.path) : [];
        const analysis = new CarAnalysis_1.CarAnalysis({
            userId: req.user._id,
            carDetails,
            problemDescription,
            images,
            status: "pending",
        });
        await analysis.save();
        return res.status(201).json({
            success: true,
            message: "Car analysis created successfully",
            data: analysis,
        });
    }
    catch (error) {
        console.error("Error creating analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
router.patch("/:id/status", [auth_1.authenticateToken, (0, auth_1.requireRole)(["admin"])], [
    (0, express_validator_1.body)("status")
        .isIn(["pending", "analyzed", "completed"])
        .withMessage("Valid status is required"),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { status } = req.body;
        const analysis = await CarAnalysis_1.CarAnalysis.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found",
            });
        }
        return res.json({
            success: true,
            message: "Analysis status updated successfully",
            data: analysis,
        });
    }
    catch (error) {
        console.error("Error updating analysis status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating analysis status",
        });
    }
});
router.delete("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const analysis = await CarAnalysis_1.CarAnalysis.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis not found",
            });
        }
        return res.json({
            success: true,
            message: "Analysis deleted successfully",
            data: analysis,
        });
    }
    catch (error) {
        console.error("Error deleting analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting analysis",
        });
    }
});
exports.default = router;
//# sourceMappingURL=carAnalysis.js.map