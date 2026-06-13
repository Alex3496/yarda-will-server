import { Document, Model, Types, Schema, model } from "mongoose";

export interface IDriverAssignmentOperation {
    operation_id: Types.ObjectId;
    freight_cost: number;
}

export interface IDriverAssignment extends Document {
    key: string;
    operations: IDriverAssignmentOperation[];
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
        operations: {
            type: [
                {
                    operation_id: {
                        type: Schema.Types.ObjectId,
                        ref: "Operation",
                        required: true,
                    },
                    freight_cost: {
                        type: Number,
                        min: 0,
                        default: 0,
                    },
                    _id: false,
                },
            ],
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

driverAssignmentSchema.index({ "operations.operation_id": 1 });
driverAssignmentSchema.index({ driver_id: 1 });

const DriverAssignment: Model<IDriverAssignment> = model<IDriverAssignment>(
    "DriverAssignment",
    driverAssignmentSchema,
);

export default DriverAssignment;
