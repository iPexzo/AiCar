import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";

const router = Router();

// Test endpoint
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Analyze route is working!",
    timestamp: new Date().toISOString(),
  });
});

// Simple test POST endpoint
router.post("/test-post", (req: Request, res: Response) => {
  console.log("=== /api/analyze/test-post endpoint hit ===");
  res.json({
    success: true,
    message: "POST request works!",
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Simple test GET endpoint for /guided path
router.get("/guided", (req: Request, res: Response) => {
  console.log("=== /api/analyze/guided GET endpoint hit ===");
  res.json({
    success: true,
    message: "GET /guided works!",
    timestamp: new Date().toISOString(),
  });
});

// Note: The real AI analysis endpoint is now in server.ts at /api/analyze-guided
// This route is kept for backward compatibility but redirects to the main endpoint
router.post("/guided", (req: Request, res: Response) => {
  console.log("=== /api/analyze/guided endpoint hit (redirecting) ===");
  res.status(307).json({
    success: false,
    message:
      "This endpoint is deprecated. Please use /api/analyze-guided instead.",
    redirect: "/api/analyze-guided",
  });
});

export default router;
