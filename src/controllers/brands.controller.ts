import { Request, Response } from "express";
import Brand from "../models/brand.model";

/**
 * @function getNextKey
 * @description Returns the next available brand key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Brand.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("M-", ""), 10) + 1
            : 1;
        const key = `M-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createBrand
 * @description Creates a new brand. The key is auto-generated via a pre-save hook.
 */
export const createBrand = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const brand = await Brand.create({ name });
        res.status(201).json({ brand });
    } catch (_error) {
        res.status(400).json({ message: "Error creating brand" });
    }
};

/**
 * @function getBrands
 * @description Retrieves a paginated list of brands with optional search on key and name.
 */
export const getBrands = async (req: Request, res: Response): Promise<void> => {
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

        const [brands, total] = await Promise.all([
            Brand.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Brand.countDocuments(filter),
        ]);

        res.status(200).json({ data: brands, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving brands" });
    }
};

/**
 * @function getBrandById
 * @description Retrieves a single brand by its MongoDB ID.
 */
export const getBrandById = async (req: Request, res: Response): Promise<void> => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }
        res.status(200).json({ brand });
    } catch (_error) {
        res.status(400).json({ message: "Invalid brand ID" });
    }
};

/**
 * @function updateBrand
 * @description Updates the name of a brand by its MongoDB ID.
 */
export const updateBrand = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body as { name?: string };
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;

        const brand = await Brand.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }

        res.status(200).json({ brand });
    } catch (_error) {
        res.status(400).json({ message: "Error updating brand" });
    }
};

/**
 * @function deleteBrand
 * @description Deletes a brand by its MongoDB ID. Requires admin role.
 */
export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);
        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }
        res.status(200).json({ message: "Brand deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid brand ID" });
    }
};
