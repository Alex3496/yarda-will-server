import { Document, Model, Schema, Types, model } from "mongoose";

export interface IService extends Document {
    key: string;
    name: string;
    type: "D" | "P"; // D for debit, P for payment
    price: number;
    region_id: Types.ObjectId | null; // Optional: null means the service applies to every region
    is_default: boolean; // Auto-selected in new operations for its region. Requires a region.
    createdAt: Date;
    updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
    {
        key: {
            type: String,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            uppercase: true,
        },
        type: {
            type: String,
            enum: ["D", "P"],
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        region_id: {
            type: Schema.Types.ObjectId,
            ref: "Region",
            default: null,
            index: true,
        },
        is_default: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

// Only one default service per region, enforced at the database level.
// is_default is part of the key only to avoid clashing with the plain region_id index.
// The name differs from the old array-based index ("unique_default_service_per_region"),
// which the migrateServiceRegion seeder drops.
serviceSchema.index(
    { region_id: 1, is_default: 1 },
    { unique: true, partialFilterExpression: { is_default: true }, name: "unique_default_service_per_region_id" },
);

serviceSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IService>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("SR-", ""), 10) + 1
            : 1;

        this.key = `SR-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Service: Model<IService> = model<IService>("Service", serviceSchema);

export default Service;
