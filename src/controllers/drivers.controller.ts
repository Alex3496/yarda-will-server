import { Request, Response } from "express";
import Driver from "../models/driver.model";

/**
 * @function getNextKey
 * @description Returns the next available driver key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Driver.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("CF-", ""), 10) + 1
            : 1;
        const key = `CF-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createDriver
 * @description Creates a new driver. The key is auto-generated via a pre-save hook.
 */
export const createDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const driver = await Driver.create({ name });
        res.status(201).json({ driver });
    } catch (_error) {
        res.status(400).json({ message: "Error creating driver" });
    }
};

/**
 * @function getDrivers
 * @description Retrieves a paginated list of drivers with optional search on key and name.
 */
export const getDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip  = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        const search = req.query.search as string | undefined;
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [{ key: regex }, { name: regex }];
        }

        const [drivers, total] = await Promise.all([
            Driver.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Driver.countDocuments(filter),
        ]);

        res.status(200).json({ data: drivers, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving drivers" });
    }
};

/**
 * @function getDriverById
 * @description Retrieves a single driver by its MongoDB ID.
 */
export const getDriverById = async (req: Request, res: Response): Promise<void> => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            res.status(404).json({ message: "Driver not found" });
            return;
        }
        res.status(200).json({ driver });
    } catch (_error) {
        res.status(400).json({ message: "Invalid driver ID" });
    }
};

/**
 * @function updateDriver
 * @description Updates the name of a driver by its MongoDB ID.
 */
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;

        const driver = await Driver.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!driver) {
            res.status(404).json({ message: "Driver not found" });
            return;
        }

        res.status(200).json({ driver });
    } catch (_error) {
        res.status(400).json({ message: "Error updating driver" });
    }
};

/**
 * @function deleteDriver
 * @description Deletes a driver by its MongoDB ID. Requires admin role.
 */
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) {
            res.status(404).json({ message: "Driver not found" });
            return;
        }
        res.status(200).json({ message: "Driver deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid driver ID" });
    }
};
