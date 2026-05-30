import { Document, Model, Schema, Types, model } from "mongoose";

export interface IVehicleModel extends Document {
    key: string;
    name: string;
    brand_id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const vehicleModelSchema = new Schema<IVehicleModel>(
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
        brand_id: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            required: true,
        },
    },
    { timestamps: true },
);

vehicleModelSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IVehicleModel>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("MD-", ""), 10) + 1
            : 1;

        this.key = `MD-${String(nextNumber).padStart(6, "0")}`;
    }
});

const VehicleModel: Model<IVehicleModel> = model<IVehicleModel>(
    "VehicleModel",
    vehicleModelSchema,
);

export default VehicleModel;
