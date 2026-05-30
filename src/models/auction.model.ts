import { Document, Model, Schema, Types, model } from "mongoose";

export interface IAuction extends Document {
    key: string;
    name: string;
    region_id?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
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
        region_id: {
            type: Schema.Types.ObjectId,
            ref: "Region",
            default: null,
        },
    },
    { timestamps: true },
);

auctionSchema.pre("save", async function () {
    if (this.isNew) {
        const last = await (this.constructor as Model<IAuction>)
            .findOne({}, { key: 1 })
            .sort({ key: -1 });

        const nextNumber = last
            ? Number.parseInt(last.key.replace("S-", ""), 10) + 1
            : 1;

        this.key = `S-${String(nextNumber).padStart(6, "0")}`;
    }
});

const Auction: Model<IAuction> = model<IAuction>("Auction", auctionSchema);

export default Auction;
