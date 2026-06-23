import { Request, Response } from "express";
import Service from "../models/service.model";

/**
 * @function getNextKey
 * @description Returns the next available service key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Service.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("SR-", ""), 10) + 1
            : 1;
        const key = `SR-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener la clave" });
    }
};

/**
 * @function createService
 * @description Creates a new service. The key is auto-generated via a pre-save hook.
 */
export const createService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, price, type } = req.body as { name?: string; price?: number; type?: "D" | "P" };
        const service = await Service.create({ name, price, type });
        res.status(201).json({ service });
    } catch (_error) {
        res.status(400).json({ message: "Error al crear servicio" });
    }
};

/**
 * @function getServices
 * @description Paginated list of services with optional text search on key and name.
 */
export const getServices = async (req: Request, res: Response): Promise<void> => {
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

        const [data, total] = await Promise.all([
            Service.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Service.countDocuments(filter),
        ]);

        res.status(200).json({ data, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener servicios" });
    }
};

/**
 * @function getServiceById
 * @description Returns a single service by its MongoDB ID.
 */
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }
        res.status(200).json({ service });
    } catch (_error) {
        res.status(400).json({ message: "ID de servicio inválido" });
    }
};

/**
 * @function updateService
 * @description Updates name and/or price of an existing service.
 */
export const updateService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, price, type } = req.body as { name?: string; price?: number; type?: "D" | "P" };
        const updateData: Record<string, unknown> = {};
        if (name  !== undefined) updateData.name  = name;
        if (price !== undefined) updateData.price = price;
        if (type  !== undefined) updateData.type  = type;

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true },
        );

        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        res.status(200).json({ service });
    } catch (_error) {
        res.status(400).json({ message: "Error al actualizar servicio" });
    }
};

/**
 * @function deleteService
 * @description Deletes a service by its MongoDB ID. Requires admin role.
 */
export const deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }
        res.status(200).json({ message: "Servicio eliminado correctamente" });
    } catch (_error) {
        res.status(400).json({ message: "ID de servicio inválido" });
    }
};
