import { Document, Model, Types, Schema, model } from "mongoose";

export interface ILoanKey extends Document {
    folio: string; // folio de la operación (denormalizado desde Operation.key)
    operation_id: Types.ObjectId;
    name: string; // nombre de quien recibe las llaves
    lent_at: Date; // fecha en que se entregaron las llaves
    returned_at?: Date | null; // fecha en que se regresaron las llaves
    lent_user_id?: Types.ObjectId; // usuario que entregó las llaves
    returned_user_id?: Types.ObjectId; // usuario que recibió las llaves de vuelta
    createdAt: Date;
    updatedAt: Date;
}

const loanKeySchema = new Schema<ILoanKey>(
    {
        folio: {
            type: String,
            required: true,
            index: true,
        },
        operation_id: {
            type: Schema.Types.ObjectId,
            ref: "Operation",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        lent_at: {
            type: Date,
            required: true,
        },
        returned_at: {
            type: Date,
            default: null,
        },
        lent_user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        returned_user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true },
);

const LoanKey: Model<ILoanKey> = model<ILoanKey>("LoanKey", loanKeySchema);

export default LoanKey;
