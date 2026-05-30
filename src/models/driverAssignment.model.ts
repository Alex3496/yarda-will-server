import { Document, Model, Types, Schema, model } from "mongoose";

export interface IDriverAssignment extends Document {
    operation_ids: Types.ObjectId[];
    driver_id: Types.ObjectId;
    assigned_at: Date;
    levantamiento_date: Date | null;
    assigned_by: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const driverAssignmentSchema = new Schema<IDriverAssignment>(
    {
        operation_ids: {
            type: [{ type: Schema.Types.ObjectId, ref: "Operation" }],
            required: true,
        },
        driver_id: {
            type: Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
        assigned_at: {
            type: Date,
            required: true,
        },
        levantamiento_date: {
            type: Date,
            default: null,
        },
        assigned_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

driverAssignmentSchema.index({ operation_ids: 1 });
driverAssignmentSchema.index({ driver_id: 1 });

const DriverAssignment: Model<IDriverAssignment> = model<IDriverAssignment>(
    "DriverAssignment",
    driverAssignmentSchema,
);

export default DriverAssignment;
