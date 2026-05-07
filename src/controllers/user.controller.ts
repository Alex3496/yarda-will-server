import { Request, Response } from "express";
import User from "../models/user.model";

/**
 * @description Sanitizes a user document by removing sensitive fields like password.
 * @param userDoc The user document to sanitize.
 * @returns The sanitized user object.
 */
const sanitizeUser = (userDoc: unknown): Record<string, unknown> => {
    const user = userDoc as { toObject: () => Record<string, unknown> };
    const plainUser = user.toObject();
    delete plainUser.password;
    return plainUser;
};

export const createUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
        res.status(400).json({ message: "Error creating user", error });
    }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

export const getUserById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ message: "Invalid user id", error });
    }
};

export const updateUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ message: "Error updating user", error });
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid user id", error });
    }
};
