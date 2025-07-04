import mongoose, { Document } from "mongoose";
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
export declare const CarAnalysis: mongoose.Model<ICarAnalysis, {}, {}, {}, mongoose.Document<unknown, {}, ICarAnalysis, {}> & ICarAnalysis & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=CarAnalysis.d.ts.map