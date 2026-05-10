import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import { sanitizeUser } from "../utils/sanitize";
import { TokenPayload } from "../utils/jwt";

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10);

/**
 * @function createUser
 * @description Creates a new user in the database with the allowed fields.
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, firstName, lastName } = req.body as {
            username?: string;
            email?: string;
            password?: string;
            firstName?: string;
            lastName?: string;
        };
        const user = await User.create({ username, email, password, firstName, lastName });
        res.status(201).json({ user: sanitizeUser(user) });
    } catch (_error) {
        res.status(400).json({ message: "Error creating user" });
    }
};

/**
 * @function getUsers
 * @description Retrieves all users from the database, excluding their passwords.
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({ users });
    } catch (_error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

/**
 * @function getUserById
 * @description Retrieves a user by their ID, excluding their password.
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (_error) {
        res.status(400).json({ message: "Invalid user id" });
    }
};

/**
 * @function updateUser
 * @description Updates a user's data by their ID. Only admins can perform this action.
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, password, isActive } = req.body as {
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
            isActive?: boolean;
        };

        const updateData: Record<string, unknown> = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (isActive !== undefined) updateData.isActive = isActive;

        if (typeof password === "string" && password.length > 0) {
            updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (_error) {
        console.error(_error);
        res.status(400).json({ message: "Error updating user" });
    }
};

/**
 * @function deleteUser
 * @description Deletes a user by their ID. Only admins can perform this action.
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const authUser = res.locals.authUser as TokenPayload;
        if (req.params.id === authUser.id) {
            res.status(403).json({ message: "No puedes eliminar tu propia cuenta" });
            return;
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid user id" });
    }
};
