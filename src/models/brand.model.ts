import { Document, Model, Schema, model } from "mongoose";

export interface IBrand extends Document {
    key: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
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

brandSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IBrand>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("M-", ""), 10) + 1
            : 1;

        this.key = `M-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Brand: Model<IBrand> = model<IBrand>("Brand", brandSchema);

export default Brand;
