import { Request, Response } from "express";
import Client, { normalizeBuyer } from "../models/clients.model";

/**
 * @function findBuyerConflict
 * @description Returns a 409 message if another client already uses `buyer`, or null if it is free.
 * `buyer` must already be normalized. Pass `excludeId` when updating.
 */
const findBuyerConflict = async (buyer: string | null, excludeId?: string): Promise<string | null> => {
    if (!buyer) return null;

    const filter: Record<string, unknown> = { buyer };
    if (excludeId) filter._id = { $ne: excludeId };

    const other = await Client.findOne(filter, { key: 1, fullname: 1 });
    return other ? `El Buyer Id ${buyer} ya pertenece a ${other.fullname} (${other.key}).` : null;
};

/** True when a save failed because of the unique buyer index (e.g. two saves at the same time). */
const isBuyerIndexConflict = (error: unknown): boolean => {
    const e = error as { code?: number; keyPattern?: Record<string, unknown> };
    return e?.code === 11000 && !!e.keyPattern && "buyer" in e.keyPattern;
};

export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Client.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("C-", ""), 10) + 1
            : 1;
        const key = `C-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener la clave" });
    }
};

export const createClient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullname, buyer, email, phone } = req.body as {
            fullname?: string;
            buyer?: string | null;
            email?: string;
            phone?: string;
        };

        const normalizedBuyer = normalizeBuyer(buyer);
        const conflict = await findBuyerConflict(normalizedBuyer);
        if (conflict) {
            res.status(409).json({ message: conflict });
            return;
        }

        const client = await Client.create({ fullname, buyer: normalizedBuyer, email, phone });
        res.status(201).json({ client });
    } catch (error) {
        if (isBuyerIndexConflict(error)) {
            res.status(409).json({ message: "Ese Buyer Id ya pertenece a otro cliente." });
            return;
        }
        res.status(400).json({ message: "Error al crear cliente" });
    }
};

export const getClients = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip  = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        const search = req.query.search as string | undefined;
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { key:      regex },
                { fullname: regex },
                { buyer:    regex },
                { email:    regex },
                { phone:    regex },
            ];
        }

        const [clients, total] = await Promise.all([
            Client.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Client.countDocuments(filter),
        ]);

        res.status(200).json({
            data: clients,
            total, 
            page, 
            limit,
        });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener clientes" });
    }
};

export const getClientById = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            res.status(404).json({ message: "Cliente no encontrado" });
            return;
        }

        res.status(200).json({ client });
    } catch (_error) {
        res.status(400).json({ message: "ID de cliente inválido" });
    }
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullname, buyer, email, phone } = req.body as {
            fullname?: string;
            buyer?: string | null;
            email?: string;
            phone?: string;
        };

        const updateData: Record<string, unknown> = {};
        if (fullname !== undefined) updateData.fullname = fullname;
        // `null` or "" removes the buyer id
        if (buyer !== undefined) {
            const normalizedBuyer = normalizeBuyer(buyer);
            const conflict = await findBuyerConflict(normalizedBuyer, req.params.id as string);
            if (conflict) {
                res.status(409).json({ message: conflict });
                return;
            }
            updateData.buyer = normalizedBuyer;
        }
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!client) {
            res.status(404).json({ message: "Cliente no encontrado" });
            return;
        }

        res.status(200).json({ client });
    } catch (error) {
        if (isBuyerIndexConflict(error)) {
            res.status(409).json({ message: "Ese Buyer Id ya pertenece a otro cliente." });
            return;
        }
        res.status(400).json({ message: "Error al actualizar cliente" });
    }
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            res.status(404).json({ message: "Cliente no encontrado" });
            return;
        }

        res.status(200).json({ message: "Cliente eliminado correctamente" });
    } catch (_error) {
        res.status(400).json({ message: "ID de cliente inválido" });
    }
};
