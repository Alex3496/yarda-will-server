import { Document, Model, Schema, model, Types } from "mongoose";

export interface IOperationService extends Document {
    operation_id: Types.ObjectId;
    concept: string;
    date: Date;
    type?: "D" | "P"; // D for debit, P for payment
    charge?: number; // only for type D
    payment?: number; // only for type P
    createdAt: Date;
    updatedAt: Date;
}

const operationServiceSchema = new Schema<IOperationService>(
    {
        operation_id: {
            type: Types.ObjectId,
            ref: "Operation",
            required: true,
        },
        concept: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            uppercase: true,
        },
        date: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            enum: ["D", "P"],
        },
        charge: {
            type: Number,
        },
        payment: {
            type: Number,
        },
    },
    { timestamps: true },
);


const OperationService: Model<IOperationService> = model<IOperationService>("OperationService", operationServiceSchema);

export default OperationService;
