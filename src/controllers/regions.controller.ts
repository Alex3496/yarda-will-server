import { Request, Response } from "express";
import Region from "../models/region.model";

/**
 * @function getNextKey
 * @description Returns the next available region key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Region.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("R-", ""), 10) + 1
            : 1;
        const key = `R-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createRegion
 * @description Creates a new region. The key is auto-generated via a pre-save hook.
 */
export const createRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const region = await Region.create({ name });
        res.status(201).json({ region });
    } catch (_error) {
        res.status(400).json({ message: "Error creating region" });
    }
};

/**
 * @function getRegions
 * @description Retrieves a paginated list of regions with optional search on key and name.
 */
export const getRegions = async (req: Request, res: Response): Promise<void> => {
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

        const [regions, total] = await Promise.all([
            Region.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Region.countDocuments(filter),
        ]);

        res.status(200).json({ data: regions, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving regions" });
    }
};

/**
 * @function getRegionById
 * @description Retrieves a single region by its MongoDB ID.
 */
export const getRegionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const region = await Region.findById(req.params.id);
        if (!region) {
            res.status(404).json({ message: "Region not found" });
            return;
        }
        res.status(200).json({ region });
    } catch (_error) {
        res.status(400).json({ message: "Invalid region ID" });
    }
};

/**
 * @function updateRegion
 * @description Updates the name of a region by its MongoDB ID.
 */
export const updateRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;

        const region = await Region.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!region) {
            res.status(404).json({ message: "Region not found" });
            return;
        }

        res.status(200).json({ region });
    } catch (_error) {
        res.status(400).json({ message: "Error updating region" });
    }
};

/**
 * @function deleteRegion
 * @description Deletes a region by its MongoDB ID. Requires admin role.
 */
export const deleteRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const region = await Region.findByIdAndDelete(req.params.id);
        if (!region) {
            res.status(404).json({ message: "Region not found" });
            return;
        }
        res.status(200).json({ message: "Region deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid region ID" });
    }
};
