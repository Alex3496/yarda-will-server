import { Document, Model, Types, Schema, model } from "mongoose";

export interface IDriverAssignment extends Document {
    key: string;
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
        key: {
            type: String,
            unique: true,
            index: true,
        },
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

driverAssignmentSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IDriverAssignment>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("V-", ""), 10) + 1
            : 1;

        this.key = `V-${String(nextNumber).padStart(6, "0")}`;
    }
});

driverAssignmentSchema.index({ operation_ids: 1 });
driverAssignmentSchema.index({ driver_id: 1 });

const DriverAssignment: Model<IDriverAssignment> = model<IDriverAssignment>(
    "DriverAssignment",
    driverAssignmentSchema,
);

export default DriverAssignment;
