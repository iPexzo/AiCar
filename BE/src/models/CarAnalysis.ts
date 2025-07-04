import mongoose, { Document, Schema } from "mongoose";

export interface ICarAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  carDetails: {
    brand: string;
    model: string;
    year: number;
    engineType: string;
    transmission: string;
    mileage: number;
  };
  problemDescription: string;
  images: string[];
  aiAnalysis: {
    diagnosis: string;
    recommendations: string[];
    severity: "low" | "medium" | "high" | "critical";
    estimatedCost: {
      min: number;
      max: number;
      currency: string;
    };
  };
  status: "pending" | "analyzed" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const carAnalysisSchema = new Schema<ICarAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    carDetails: {
      brand: {
        type: String,
        required: [true, "Car brand is required"],
        trim: true,
      },
      model: {
        type: String,
        required: [true, "Car model is required"],
        trim: true,
      },
      year: {
        type: Number,
        required: [true, "Car year is required"],
        min: [1900, "Year must be after 1900"],
        max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
      },
      engineType: {
        type: String,
        required: [true, "Engine type is required"],
        enum: ["gasoline", "diesel", "hybrid", "electric", "other"],
      },
      transmission: {
        type: String,
        required: [true, "Transmission type is required"],
        enum: ["manual", "automatic", "cvt", "other"],
      },
      mileage: {
        type: Number,
        required: [true, "Mileage is required"],
        min: [0, "Mileage cannot be negative"],
      },
    },
    problemDescription: {
      type: String,
      required: [true, "Problem description is required"],
      trim: true,
      minlength: [
        10,
        "Problem description must be at least 10 characters long",
      ],
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
    aiAnalysis: {
      diagnosis: {
        type: String,
        required: false,
      },
      recommendations: [
        {
          type: String,
          required: false,
        },
      ],
      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      estimatedCost: {
        min: {
          type: Number,
          required: false,
          min: [0, "Minimum cost cannot be negative"],
        },
        max: {
          type: Number,
          required: false,
          min: [0, "Maximum cost cannot be negative"],
        },
        currency: {
          type: String,
          default: "USD",
        },
      },
    },
    status: {
      type: String,
      enum: ["pending", "analyzed", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
carAnalysisSchema.index({ userId: 1, createdAt: -1 });
carAnalysisSchema.index({ status: 1 });

export const CarAnalysis = mongoose.model<ICarAnalysis>(
  "CarAnalysis",
  carAnalysisSchema
);
