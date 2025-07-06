import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileTypeFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .png files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileTypeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Error handling middleware for multer
const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

export { upload, handleUploadError };
