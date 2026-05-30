import { Document, Model, Schema, model } from "mongoose";

export interface IClient extends Document {
    key: string;
    fullname: string;
    buyer?: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
    {
        key: {
            type: String,
            unique: true,
            index: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            uppercase: true,
        },
        // is like an external id
        buyer: {
            type: String,
            trim: true,
            maxlength: 120,
            unique: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
    },
    {
        timestamps: true,
    },
);

clientSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IClient>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("C-", ""), 10) + 1
            : 1;

        this.key = `C-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Client: Model<IClient> = model<IClient>("Client", clientSchema);

export default Client;
