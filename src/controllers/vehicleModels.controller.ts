import { Request, Response } from "express";
import VehicleModel from "../models/vehicleModel.model";

/** Shape of the populated brand field returned in responses. */
interface PopulatedBrand {
    _id: string;
    key: string;
    name: string;
}

/**
 * @function getNextKey
 * @description Returns the next available vehicle model key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await VehicleModel.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("MD-", ""), 10) + 1
            : 1;
        const key = `MD-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createVehicleModel
 * @description Creates a new vehicle model linked to a brand. The key is auto-generated.
 */
export const createVehicleModel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, brandId } = req.body as { name?: string; brandId?: string };
        const vehicleModel = await VehicleModel.create({ name, brand: brandId });
        await vehicleModel.populate<{ brand: PopulatedBrand }>("brand", "key name");
        res.status(201).json({ vehicleModel });
    } catch (_error) {
        res.status(400).json({ message: "Error creating vehicle model" });
    }
};

/**
 * @function getVehicleModels
 * @description Retrieves a paginated list of vehicle models with brand populated.
 *              Supports optional search on key, name, and brand name.
 */
export const getVehicleModels = async (req: Request, res: Response): Promise<void> => {
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

        const [vehicleModels, total] = await Promise.all([
            VehicleModel.find(filter)
                .populate<{ brand: PopulatedBrand }>("brand", "key name")
                .sort({ key: 1 })
                .skip(skip)
                .limit(limit),
            VehicleModel.countDocuments(filter),
        ]);

        res.status(200).json({ data: vehicleModels, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving vehicle models" });
    }
};

/**
 * @function getVehicleModelById
 * @description Retrieves a single vehicle model by its MongoDB ID with brand populated.
 */
export const getVehicleModelById = async (req: Request, res: Response): Promise<void> => {
    try {
        const vehicleModel = await VehicleModel.findById(req.params.id)
            .populate<{ brand: PopulatedBrand }>("brand", "key name");

        if (!vehicleModel) {
            res.status(404).json({ message: "Vehicle model not found" });
            return;
        }

        res.status(200).json({ vehicleModel });
    } catch (_error) {
        res.status(400).json({ message: "Invalid vehicle model ID" });
    }
};

/**
 * @function updateVehicleModel
 * @description Updates the name and/or brand of a vehicle model by its MongoDB ID.
 */
export const updateVehicleModel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, brandId } = req.body as { name?: string; brandId?: string };
        const updateData: Record<string, unknown> = {};
        if (name     !== undefined) updateData.name  = name;
        if (brandId  !== undefined) updateData.brand = brandId;

        const vehicleModel = await VehicleModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true },
        ).populate<{ brand: PopulatedBrand }>("brand", "key name");

        if (!vehicleModel) {
            res.status(404).json({ message: "Vehicle model not found" });
            return;
        }

        res.status(200).json({ vehicleModel });
    } catch (_error) {
        res.status(400).json({ message: "Error updating vehicle model" });
    }
};

/**
 * @function deleteVehicleModel
 * @description Deletes a vehicle model by its MongoDB ID. Requires admin role.
 */
export const deleteVehicleModel = async (req: Request, res: Response): Promise<void> => {
    try {
        const vehicleModel = await VehicleModel.findByIdAndDelete(req.params.id);
        if (!vehicleModel) {
            res.status(404).json({ message: "Vehicle model not found" });
            return;
        }
        res.status(200).json({ message: "Vehicle model deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid vehicle model ID" });
    }
};
