import { Document, Model, Schema, model } from "mongoose";

export interface IRegion extends Document {
    key: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const regionSchema = new Schema<IRegion>(
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
    },
    { timestamps: true },
);

regionSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IRegion>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("R-", ""), 10) + 1
            : 1;

        this.key = `R-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Region: Model<IRegion> = model<IRegion>("Region", regionSchema);

export default Region;
