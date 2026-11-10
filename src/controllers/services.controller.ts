import { Request, Response } from "express";
import { Types } from "mongoose";
import Service from "../models/service.model";
import Region from "../models/region.model";

type ServiceBody = {
    name?: string;
    price?: number;
    type?: "D" | "P";
    region_id?: unknown;
    is_default?: unknown;
};

/**
 * @function parseRegionId
 * @description Normalizes `region_id` from the request body.
 * Returns `undefined` when the field was not sent, `null` to clear the region (`null` or `""`),
 * the ID string when valid, or `false` when the value is malformed.
 */
const parseRegionId = (value: unknown): string | null | undefined | false => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    return typeof value === "string" && Types.ObjectId.isValid(value) ? value : false;
};

const REGION_POPULATE = { path: "region_id", select: "key name" };

const INVALID_DATA = "Región o valor de 'por defecto' inválido";
const DEFAULT_REQUIRES_REGION = "Un servicio por defecto debe tener una región.";
const DEFAULT_CONFLICT = "Otro servicio se marcó como predeterminado para esta región al mismo tiempo. Intenta de nuevo.";

/** Returns `undefined` when not sent, the boolean when valid, or `null` when malformed. */
const parseIsDefault = (value: unknown): boolean | null | undefined => {
    if (value === undefined) return undefined;
    return typeof value === "boolean" ? value : null;
};

/**
 * @function unsetPreviousDefault
 * @description Removes the default flag from whichever service currently holds it for `regionId`
 * (excluding `excludeId`). Returns the services that lost the flag so the UI can inform the user.
 */
const unsetPreviousDefault = async (
    regionId: string,
    excludeId?: string,
): Promise<Array<{ _id: Types.ObjectId; key: string; name: string }>> => {
    const filter: Record<string, unknown> = { is_default: true, region_id: regionId };
    if (excludeId) filter._id = { $ne: excludeId };

    const previous = await Service.find(filter, { key: 1, name: 1 });
    if (previous.length) {
        await Service.updateMany({ _id: { $in: previous.map((s) => s._id) } }, { is_default: false });
    }
    return previous.map((s) => ({ _id: s._id as Types.ObjectId, key: s.key, name: s.name }));
};

/** True when a save failed because of the unique default-per-region index (race between two saves). */
const isDefaultIndexConflict = (error: unknown): boolean => {
    const e = error as { code?: number; keyPattern?: Record<string, unknown> };
    return e?.code === 11000 && !!e.keyPattern && "region_id" in e.keyPattern;
};

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
        const { name, price, type, region_id, is_default } = req.body as ServiceBody;
        const regionId = parseRegionId(region_id);
        const isDefault = parseIsDefault(is_default);
        if (regionId === false || isDefault === null) {
            res.status(400).json({ message: INVALID_DATA });
            return;
        }

        const finalRegion = regionId ?? null;
        if (isDefault && !finalRegion) {
            res.status(400).json({ message: DEFAULT_REQUIRES_REGION });
            return;
        }
        const finalDefault = !!isDefault;

        const service = new Service({ name, price, type, region_id: finalRegion, is_default: finalDefault });
        // Validate before touching other services so a bad payload does not unset someone else's default
        await service.validate();

        const replaced_defaults = finalDefault && finalRegion ? await unsetPreviousDefault(finalRegion) : [];

        await service.save();
        await service.populate(REGION_POPULATE);
        res.status(201).json({ service, replaced_defaults });
    } catch (error) {
        if (isDefaultIndexConflict(error)) {
            res.status(409).json({ message: DEFAULT_CONFLICT });
            return;
        }
        res.status(400).json({ message: "Error al crear servicio" });
    }
};

/**
 * @function getServices
 * @description Paginated list of services. `search` matches key, name or region key/name;
 * `region_id` restricts to services explicitly linked to that region.
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
            // Also match services linked to a region whose key or name matches the search
            const regions = await Region.find({ $or: [{ key: regex }, { name: regex }] }, { _id: 1 });
            filter.$or = [
                { key: regex },
                { name: regex },
                ...(regions.length ? [{ region_id: { $in: regions.map((r) => r._id) } }] : []),
            ];
        }

        // Optional exact filter: only services explicitly linked to this region
        const regionId = req.query.region_id as string | undefined;
        if (regionId) {
            if (!Types.ObjectId.isValid(regionId)) {
                res.status(400).json({ message: "Región inválida" });
                return;
            }
            filter.region_id = regionId;
        }

        const [data, total] = await Promise.all([
            Service.find(filter).sort({ key: 1 }).skip(skip).limit(limit).populate(REGION_POPULATE),
            Service.countDocuments(filter),
        ]);

        res.status(200).json({ data, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener servicios" });
    }
};

/**
 * @function getDefaultService
 * @description Returns the default service for `?region_id=`, or `{ service: null }` if the region has none.
 */
export const getDefaultService = async (req: Request, res: Response): Promise<void> => {
    try {
        const regionId = req.query.region_id as string | undefined;
        if (!regionId || !Types.ObjectId.isValid(regionId)) {
            res.status(400).json({ message: "Región inválida" });
            return;
        }

        const service = await Service.findOne({ is_default: true, region_id: regionId });
        res.status(200).json({ service });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener el servicio por defecto" });
    }
};

/**
 * @function getServiceById
 * @description Returns a single service by its MongoDB ID.
 */
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id).populate(REGION_POPULATE);
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
 * @description Updates name, price, type, region and/or default flag of an existing service.
 * Sending `region_id: null` (or `""`) removes the region, which also clears the default flag.
 */
export const updateService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, price, type, region_id, is_default } = req.body as ServiceBody;
        const regionId = parseRegionId(region_id);
        const isDefault = parseIsDefault(is_default);
        if (regionId === false || isDefault === null) {
            res.status(400).json({ message: INVALID_DATA });
            return;
        }

        const existing = await Service.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        // Merge with the stored values so partial updates keep the default rules consistent
        const finalRegion = regionId !== undefined
            ? regionId
            : (existing.region_id ? String(existing.region_id) : null);
        if (isDefault && !finalRegion) {
            res.status(400).json({ message: DEFAULT_REQUIRES_REGION });
            return;
        }
        // Removing the region without touching the flag silently clears it
        const finalDefault = (isDefault ?? existing.is_default) && !!finalRegion;

        const updateData: Record<string, unknown> = { is_default: finalDefault };
        if (name     !== undefined) updateData.name      = name;
        if (price    !== undefined) updateData.price     = price;
        if (type     !== undefined) updateData.type      = type;
        if (regionId !== undefined) updateData.region_id = regionId;

        const replaced_defaults = finalDefault && finalRegion
            ? await unsetPreviousDefault(finalRegion, String(existing._id))
            : [];

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true },
        ).populate(REGION_POPULATE);

        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        res.status(200).json({ service, replaced_defaults });
    } catch (error) {
        if (isDefaultIndexConflict(error)) {
            res.status(409).json({ message: DEFAULT_CONFLICT });
            return;
        }
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
