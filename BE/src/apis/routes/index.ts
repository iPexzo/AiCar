import { Router } from "express";
import analyzeRouter from "./analyze";
import carQueryRouter from "./carQuery";
import carAnalysisRouter from "./carAnalysis";
import carCareKioskRouter from "./carCareKiosk";
import uploadRouter from "./upload";
import authRouter from "./auth";

const router = Router();

// Diagnostic Flow
router.use("/analyze", analyzeRouter);
router.use("/car-analysis", carAnalysisRouter);

// Car Data
router.use("/car-query", carQueryRouter);

// Car Care Kiosk Video Search
router.use("/car-care-kiosk", carCareKioskRouter);

// Image Upload
router.use("/upload", uploadRouter);

// Auth
router.use("/auth", authRouter);

// Car Parts (placeholder)
router.get("/car-parts", (req, res) => {
  res.json({
    success: true,
    parts: [
      "Engine",
      "Transmission",
      "Brakes",
      "Suspension",
      "Battery",
      "Alternator",
      "Radiator",
      "Exhaust",
      "Fuel Pump",
      "Air Filter",
      "Oil Filter",
      "Timing Belt",
      "Spark Plug",
      "Catalytic Converter",
      "AC Compressor",
    ],
  });
});

export default router;
