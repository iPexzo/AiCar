import { Router } from "express";
import {
  uploadImage,
  uploadMultipleImages,
} from "../../controllers/uploadController";
import { upload, handleUploadError } from "../../middlewares/imageUpload";

const router = Router();

// Single image upload endpoint
router.post("/image", upload.single("image"), handleUploadError, uploadImage);

// Multiple images upload endpoint
router.post(
  "/images",
  upload.array("images", 5),
  handleUploadError,
  uploadMultipleImages
);

export default router;
