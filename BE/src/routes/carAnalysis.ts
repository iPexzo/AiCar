import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireRole } from "../middleware/auth";
import { upload, handleUploadError } from "../middleware/upload";
import { CarAnalysis } from "../models/CarAnalysis";

const router = Router();

// Get all car analyses for the authenticated user
router.get("/", authenticateToken, async (req: any, res: Response) => {
  try {
    const analyses = await CarAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get a specific car analysis by ID
router.get("/:id", authenticateToken, async (req: any, res: Response) => {
  try {
    const analysis = await CarAnalysis.findOne({
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
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create a new car analysis
router.post(
  "/",
  [authenticateToken, upload.array("images", 5), handleUploadError],
  [
    body("carDetails.brand").notEmpty().withMessage("Car brand is required"),
    body("carDetails.model").notEmpty().withMessage("Car model is required"),
    body("carDetails.year")
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Valid car year is required"),
    body("carDetails.engineType")
      .isIn(["gasoline", "diesel", "hybrid", "electric", "other"])
      .withMessage("Valid engine type is required"),
    body("carDetails.transmission")
      .isIn(["manual", "automatic", "cvt", "other"])
      .withMessage("Valid transmission type is required"),
    body("carDetails.mileage")
      .isInt({ min: 0 })
      .withMessage("Valid mileage is required"),
    body("problemDescription")
      .isLength({ min: 10 })
      .withMessage("Problem description must be at least 10 characters long"),
  ],
  async (req: any, res: Response) => {
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

      const { carDetails, problemDescription } = req.body;

      // Get uploaded image paths
      const images = req.files ? req.files.map((file: any) => file.path) : [];

      // Create new car analysis
      const analysis = new CarAnalysis({
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
    } catch (error) {
      console.error("Error creating analysis:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Update car analysis status (admin only)
router.patch(
  "/:id/status",
  [authenticateToken, requireRole(["admin"])],
  [
    body("status")
      .isIn(["pending", "analyzed", "completed"])
      .withMessage("Valid status is required"),
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { status } = req.body;
      const analysis = await CarAnalysis.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

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
    } catch (error) {
      console.error("Error updating analysis status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while updating analysis status",
      });
    }
  }
);

// Delete car analysis
router.delete("/:id", authenticateToken, async (req: any, res: Response) => {
  try {
    const analysis = await CarAnalysis.findOneAndDelete({
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
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting analysis",
    });
  }
});

export default router;
