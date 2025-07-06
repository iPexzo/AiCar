import { Request, Response } from "express";

export const uploadImage = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Return file information
    return res.json({
      success: true,
      message: "Image uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during upload",
    });
  }
};

export const uploadMultipleImages = (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];

    // Return file information for all uploaded files
    return res.json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      files: files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during upload",
    });
  }
};
