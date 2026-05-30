import { Document, Model, Types, Schema, model } from "mongoose";

export interface IOperation extends Document {
    key: string;
    batch?: string;
    buyer?: string;
    client_id?: Types.ObjectId;
    contact_id?: Types.ObjectId;
    title_type?: string;
    title_date?: Date;
    year: number;
    model_id?: Types.ObjectId;
    brand_id?: Types.ObjectId;
    pin?: string;
    vin?: string;
    color?: string;
    auction_id?: Types.ObjectId;
    region_id?: Types.ObjectId;
    expiration_date?: Date;
    captured_at?: Date;
    has_key?: boolean;
    cost: number;
    balance: number | null;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const operationSchema = new Schema<IOperation>(
    {
        key: {
            type: String,
            unique: true,
            index: true,
        },
        batch: {
            type: String,
            trim: true,
            maxlength: 120,
            unique: true,
        },
        buyer: {
            type: String,
            trim: true,
            maxlength: 120,
        },
        client_id: {
            type: Schema.Types.ObjectId,
            ref: "Client",
        },
        contact_id: {
            type: Schema.Types.ObjectId,
            ref: "Contact",
        },
        model_id: {
            type: Schema.Types.ObjectId,
            ref: "VehicleModel",
        },
        brand_id: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
        },
        auction_id: {
            type: Schema.Types.ObjectId,
            ref: "Auction",
        },
        region_id: {
            type: Schema.Types.ObjectId,
            ref: "Region",
        },
        title_type: {
            type: String,
            enum: ["mail", "driver"]
        },
        title_date: {
            type: Date,
        },
        year: {
            type: Number,
            required: true,
            min: 1900,
            max: 3000,
        },
        pin: {
            type: String,
            trim: true,
            maxlength: 20,
            uppercase: true,
        },
        vin: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 40,
        },
        color: {
            type: String,
            trim: true,
            maxlength: 60,
            uppercase: true,
        },
        expiration_date: {
            type: Date,
        },
        captured_at: {
            type: Date,
        },
        has_key: {
            type: Boolean,
            default: false,
        },
        cost: {
            type: Number,
            min: 0,
            default: 0,
        },
        balance: {
            type: Number,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1500,
        },
    },
    { timestamps: true },
);

operationSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IOperation>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("O-", ""), 10) + 1
            : 1;

        this.key = `O-${String(nextNumber).padStart(6, "0")}`;
    }
});

//indexes
operationSchema.index({ batch: 1 });

const Operation: Model<IOperation> = model<IOperation>("Operation", operationSchema);

export default Operation;
