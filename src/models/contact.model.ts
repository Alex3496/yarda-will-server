import { Document, Model, Schema, model } from "mongoose";

export interface IContact extends Document {
    key: string;
    name: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
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
        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
    },
    { timestamps: true },
);

contactSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IContact>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("CT-", ""), 10) + 1
            : 1;

        this.key = `CT-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Contact: Model<IContact> = model<IContact>("Contact", contactSchema);

export default Contact;
