import { Document, Model, Schema, model } from "mongoose";

/**
 * Normalizes a buyer id: trims it, stores it in uppercase and turns empty values into null,
 * so "abc123", " ABC123 " and "ABC123" are the same id and every "no buyer" is stored the same way.
 */
export const normalizeBuyer = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : null;
};

export interface IClient extends Document {
    key: string;
    fullname: string;
    buyer?: string | null;
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
        // External id. Optional, but unique among clients that have one (see index below).
        buyer: {
            type: String,
            maxlength: 120,
            default: null,
            set: normalizeBuyer,
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

// Unique only when a buyer id is present: null is not a string, so any number of
// clients can have no buyer id. Replaces the old plain unique index "buyer_1",
// which the migrateClientBuyer seeder drops.
clientSchema.index(
    { buyer: 1 },
    { unique: true, partialFilterExpression: { buyer: { $type: "string" } }, name: "unique_buyer_when_present" },
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
