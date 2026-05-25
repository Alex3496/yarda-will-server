import { Request, Response } from "express";
import Operation from "../models/operations.model";

interface PopulatedRef {
    _id: string;
    key: string;
    name: string;
}

interface PopulatedClient {
    _id: string;
    key: string;
    fullname: string;
}

/**
 * @function getNextKey
 * @description Returns the next available operation key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Operation.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("O-", ""), 10) + 1
            : 1;
        const key = `O-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener la clave" });
    }
};

/**
 * @function createOperation
 * @description Creates a new operation. The key is auto-generated via a pre-save hook.
 */
export const createOperation = async (req: Request, res: Response) => {
    try {
        const {
            batch, buyer, client_id, contact_id, title_type, title_date,
            year, model_id, brand_id, pin, vin, color, auction_id, region_id,
            expiration_date, captured_at, has_key, cost, notes,
        } = req.body;

        console.log('Received operation creation request with batch:', req.body); // Debug log

        let oldOperation = await Operation.findOne({ batch })
        if(oldOperation){
            return res.status(400).json({ message: "Ya existe una operación con este número de lote" });
        }

        const operation = await Operation.create({
            batch, buyer, client_id, contact_id, title_type, title_date,
            year, model_id, brand_id, pin, vin, color, auction_id, region_id,
            expiration_date, captured_at, has_key, cost, notes,
        });

        res.status(201).json({ operation });
    } catch (_error) {
        console.error(_error);
        res.status(400).json({ message: "Error al crear operación" });
    }
};

/**
 * @function getOperations
 * @description Paginated list of operations with optional text search.
 *              Populates brand and model for display purposes.
 */
export const getOperations = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip  = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        const search = req.query.search as string | undefined;
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { key:   regex },
                { vin:   regex },
                { pin:   regex },
                { buyer: regex },
                { batch: regex },
                { color: regex },
            ];
        }

        const [data, total] = await Promise.all([
            Operation.find(filter)
                .populate<{ brand_id: PopulatedRef }>("brand_id", "key name")
                .populate<{ model_id: PopulatedRef }>("model_id", "key name")
                .populate<{ client_id: PopulatedClient }>("client_id", "key fullname buyer")
                .populate<{ contact_id: PopulatedRef }>("contact_id", "key name")
                .sort({ key: -1 })
                .skip(skip)
                .limit(limit),
            Operation.countDocuments(filter),
        ]);

        res.status(200).json({ data, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener operaciones" });
    }
};

/**
 * @function getOperationById
 * @description Returns a single operation with all references fully populated.
 */
export const getOperationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const operation = await Operation.findById(req.params.id)
            .populate("brand_id",   "key name")
            .populate("model_id",   "key name")
            .populate("client_id",  "key fullname")
            .populate("contact_id", "key name")
            .populate("auction_id", "key name")
            .populate("region_id",  "key name");

        if (!operation) {
            res.status(404).json({ message: "Operación no encontrada" });
            return;
        }

        res.status(200).json({ operation });
    } catch (_error) {
        res.status(400).json({ message: "ID de operación inválido" });
    }
};

/**
 * @function updateOperation
 * @description Updates allowed fields of an existing operation.
 */
export const updateOperation = async (req: Request, res: Response): Promise<void> => {
    try {
        const allowed = [
            "batch", "buyer", "client_id", "contact_id", "title_type", "title_date",
            "year", "model_id", "brand_id", "pin", "vin", "color", "auction_id",
            "region_id", "expiration_date", "captured_at", "has_key", "cost", "notes",
        ];

        if (req.body.batch){

        }

        const updateData: Record<string, unknown> = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }

        const operation = await Operation.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true },
        );

        if (!operation) {
            res.status(404).json({ message: "Operación no encontrada" });
            return;
        }

        res.status(200).json({ operation });
    } catch (_error) {
        console.error(_error);
        res.status(400).json({ message: "Error al actualizar operación" });
    }
};

/**
 * @function deleteOperation
 * @description Deletes an operation by its MongoDB ID. Requires admin role.
 */
export const deleteOperation = async (req: Request, res: Response): Promise<void> => {
    try {
        const operation = await Operation.findByIdAndDelete(req.params.id);

        if (!operation) {
            res.status(404).json({ message: "Operación no encontrada" });
            return;
        }

        res.status(200).json({ message: "Operación eliminada correctamente" });
    } catch (_error) {
        res.status(400).json({ message: "ID de operación inválido" });
    }
};
