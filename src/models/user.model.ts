import { Document, Model, Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const parsedSaltRounds = Number.parseInt(
    process.env.BCRYPT_SALT_ROUNDS ?? "10",
    10,
);
const SALT_ROUNDS = Number.isNaN(parsedSaltRounds) ? 10 : parsedSaltRounds;

export type UserRole = "user" | "admin";

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false, // Don't return password by default
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: 60,
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: 60,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

userSchema.pre("save", async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

const User: Model<IUser> = model<IUser>("User", userSchema);

export default User;
