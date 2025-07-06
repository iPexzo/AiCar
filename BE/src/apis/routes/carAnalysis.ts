import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken, requireRole } from "../../middlewares/auth";
import { upload, handleUploadError } from "../../middlewares/imageUpload";
import {
  getAllAnalyses,
  getAnalysisById,
  createAnalysis,
  updateAnalysisStatus,
  deleteAnalysis,
} from "../../controllers/carAnalysisController";

const router = Router();

// Get all car analyses for the authenticated user
router.get("/", authenticateToken, getAllAnalyses);

// Get a specific car analysis by ID
router.get("/:id", authenticateToken, getAnalysisById);

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
  createAnalysis
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
  updateAnalysisStatus
);

// Delete car analysis
router.delete("/:id", authenticateToken, deleteAnalysis);

export default router;
