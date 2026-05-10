import { Request, Response } from "express";
import Client from "../models/clients.model";

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
            buyer?: string;
            email?: string;
            phone?: string;
        };
        const client = await Client.create({ fullname, buyer, email, phone });
        res.status(201).json({ client });
    } catch (_error) {
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
            buyer?: string;
            email?: string;
            phone?: string;
        };

        const updateData: Record<string, unknown> = {};
        if (fullname !== undefined) updateData.fullname = fullname;
        if (buyer !== undefined) updateData.buyer = buyer;
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
    } catch (_error) {
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
