import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { CarAnalysis } from "../models/CarAnalysis";

// Extend Request to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getAllAnalyses = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
};

export const getAnalysisById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
};

export const createAnalysis = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
    const images =
      req.files && Array.isArray(req.files)
        ? req.files.map((file: any) => file.path)
        : [];

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
};

export const updateAnalysisStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
};

export const deleteAnalysis = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
};
