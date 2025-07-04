"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarAnalysis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const carAnalysisSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
carAnalysisSchema.index({ userId: 1, createdAt: -1 });
carAnalysisSchema.index({ status: 1 });
exports.CarAnalysis = mongoose_1.default.model("CarAnalysis", carAnalysisSchema);
//# sourceMappingURL=CarAnalysis.js.map