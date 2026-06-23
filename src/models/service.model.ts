import { Document, Model, Schema, model } from "mongoose";

export interface IService extends Document {
    key: string;
    name: string;
    type: "D" | "P"; // D for debit, P for payment
    price: number;
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
    },
    { timestamps: true },
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
