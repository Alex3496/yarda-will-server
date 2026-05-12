import { Document, Model, Schema, model } from "mongoose";

export interface IDriver extends Document {
    key: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
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
        },
    },
    { timestamps: true },
);

driverSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IDriver>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("CF-", ""), 10) + 1
            : 1;

        this.key = `CF-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Driver: Model<IDriver> = model<IDriver>("Driver", driverSchema);

export default Driver;
