import { Request, Response } from "express";

export const testAnalyze = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Analyze route is working!",
    timestamp: new Date().toISOString(),
  });
};

export const testPostAnalyze = (req: Request, res: Response) => {
  console.log("=== /api/analyze/test-post endpoint hit ===");
  res.json({
    success: true,
    message: "POST request works!",
    body: req.body,
    timestamp: new Date().toISOString(),
  });
};

export const testGetGuided = (req: Request, res: Response) => {
  console.log("=== /api/analyze/guided GET endpoint hit ===");
  res.json({
    success: true,
    message: "GET /guided works!",
    timestamp: new Date().toISOString(),
  });
};

export const redirectGuided = (req: Request, res: Response) => {
  console.log("=== /api/analyze/guided endpoint hit (redirecting) ===");
  res.status(307).json({
    success: false,
    message:
      "This endpoint is deprecated. Please use /api/analyze-guided instead.",
    redirect: "/api/analyze-guided",
  });
};
