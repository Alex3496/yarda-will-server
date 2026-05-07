import { Request, Response } from "express";
import User from "../models/user.model";
import { sanitizeUser } from "../utils/sanitize";

/**
 * @function createUser
 * @description Creates a new user in the database.
 */
export const createUser = async (req: Request, res: Response,): Promise<void> => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
        res.status(400).json({ message: "Error creating user", error });
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
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

/**
 * @function getUserById
 * @description Retrieves a user by their ID, excluding their password.
 */
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

/**
 * @function updateUser
 * @description Updates a user's information by their ID, excluding their password.
 */
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

/**
 * @function deleteUser
 * @description Deletes a user by their ID.
 */
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
