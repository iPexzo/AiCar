import { Router } from "express";
import {
  testAnalyze,
  testPostAnalyze,
  testGetGuided,
  redirectGuided,
} from "../../controllers/analyzeController";

const router = Router();

// Test endpoints
router.get("/test", testAnalyze);
router.post("/test-post", testPostAnalyze);
router.get("/guided", testGetGuided);
router.post("/guided", redirectGuided);

// Enhanced validation test endpoints
router.post("/test-model-check", async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const { checkIfModelAndSuggestBrand } = await import(
      "../../utils/nhtsaValidation"
    );
    const result = await checkIfModelAndSuggestBrand(input);

    return res.json({
      success: true,
      input,
      result,
    });
  } catch (error) {
    console.error("Test model check error:", error);
    return res.status(500).json({ error: "Test failed" });
  }
});

router.post("/test-brand-validation", async (req, res) => {
  try {
    const { brand } = req.body;
    if (!brand) {
      return res.status(400).json({ error: "Brand is required" });
    }

    const { validateBrand } = await import("../../utils/nhtsaValidation");
    const result = await validateBrand(brand);

    return res.json({
      success: true,
      brand,
      result,
    });
  } catch (error) {
    console.error("Test brand validation error:", error);
    return res.status(500).json({ error: "Test failed" });
  }
});

router.post("/test-model-validation", async (req, res) => {
  try {
    const { brand, model } = req.body;
    if (!brand || !model) {
      return res.status(400).json({ error: "Brand and model are required" });
    }

    const { validateModel } = await import("../../utils/nhtsaValidation");
    const result = await validateModel(brand, model);

    return res.json({
      success: true,
      brand,
      model,
      result,
    });
  } catch (error) {
    console.error("Test model validation error:", error);
    return res.status(500).json({ error: "Test failed" });
  }
});

router.post("/test-year-validation", async (req, res) => {
  try {
    const { brand, model, year } = req.body;
    if (!brand || !model || !year) {
      return res
        .status(400)
        .json({ error: "Brand, model, and year are required" });
    }

    const { validateYearForBrandModel } = await import(
      "../../utils/nhtsaValidation"
    );
    const result = await validateYearForBrandModel(brand, model, year);

    return res.json({
      success: true,
      brand,
      model,
      year,
      result,
    });
  } catch (error) {
    console.error("Test year validation error:", error);
    return res.status(500).json({ error: "Test failed" });
  }
});

export default router;
