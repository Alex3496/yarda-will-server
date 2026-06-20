import { Request, Response } from "express";
import { Types } from "mongoose";
import Operation from "../models/operations.model";
import OperationService from "../models/operations_services.model";
import Service from "../models/service.model";
import { recalculateBalance } from "../services/operations.service";
import User from "../models/user.model";
import { generateDeliveredReportPDF, DeliveredOperationRow } from "../resources/PDFs/DeliveredReportPDF";

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
            expiration_date, captured_at, has_key, cost, notes, service_id
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

        if(service_id){
            const service = await Service.findById(service_id);

            await OperationService.create({
                operation_id: operation._id,
                concept: service ? service.name : "Servicio no encontrado",
                date: new Date(),
                type: "D",
                charge: service ? service.price : 0,
            });

            await recalculateBalance(String(operation._id));
        }

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

        const settled = req.query.settled as string | undefined;
        if (settled === "true")  filter.balance = { $lte: 0, $ne: null };
        if (settled === "false") filter.balance = { $gt: 0 };

        if (req.query.no_driver === "true") filter.driver_id = null;

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

        const sort: Record<string, 1 | -1> = req.query.no_driver === "true"
            ? { expiration_date: 1 }
            : { key: -1 };

        const [data, total] = await Promise.all([
            Operation.find(filter)
                .populate<{ brand_id: PopulatedRef }>("brand_id", "key name")
                .populate<{ model_id: PopulatedRef }>("model_id", "key name")
                .populate<{ client_id: PopulatedClient }>("client_id", "key fullname buyer")
                .populate<{ contact_id: PopulatedRef }>("contact_id", "key name")
                .populate<{ region_id: PopulatedRef }>("region_id", "key name")
                .populate<{ auction_id: PopulatedRef }>("auction_id", "key name")
                .sort(sort)
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
            .populate("region_id",  "key name")
            .populate("driver_id",  "key name")
            .populate("deliver_id", "username firstName lastName");

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
 * @function getDeliveredReportPDF
 * @description Generates a PDF report of units delivered within a date range,
 * optionally filtered by the system user who delivered them. If no user is
 * provided, all delivered units in the range are included.
 */
export const getDeliveredReportPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const deliverIdRaw = String(req.query.deliver_id ?? "").trim();
        const fromRaw = req.query.from as string | undefined;
        const toRaw = req.query.to as string | undefined;

        const fromDate = fromRaw ? new Date(fromRaw) : null;
        const toDate = toRaw ? new Date(toRaw) : null;

        if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            res.status(400).json({ message: "Rango de fechas inválido" });
            return;
        }

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        // Usuario opcional: si se envía, debe ser válido; si no, se incluyen todos.
        let deliverName: string | null = null;
        const filter: Record<string, unknown> = {
            delivered_at: { $gte: fromDate, $lte: toDate },
        };

        if (deliverIdRaw) {
            if (!Types.ObjectId.isValid(deliverIdRaw)) {
                res.status(400).json({ message: "deliver_id inválido" });
                return;
            }
            const user = await User.findById(deliverIdRaw).select("username firstName lastName");
            if (!user) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }
            filter.deliver_id = new Types.ObjectId(deliverIdRaw);
            deliverName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
        }

        const operations = await Operation.find(filter)
            .select("key batch year color title_type brand_id model_id auction_id contact_id client_id delivered_at deliver_id")
            .populate("brand_id", "name")
            .populate("model_id", "name")
            .populate("auction_id", "name")
            .populate("contact_id", "name")
            .populate("client_id", "fullname")
            .populate("deliver_id", "username firstName lastName")
            .sort({ delivered_at: 1 });

        if (operations.length === 0) {
            res.status(404).json({ message: "No hay unidades entregadas en ese rango" });
            return;
        }

        const operationRows = operations.map((op) => op.toObject()) as unknown as DeliveredOperationRow[];

        const buffer = await generateDeliveredReportPDF({
            deliverName,
            from: fromDate,
            to: toDate,
            operations: operationRows,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="unidades-entregadas.pdf"`);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al generar reporte" });
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
            "driver_id", "driver_assigned_at", "levantamiento_date", "images", "arrival_date",
            "deliver_id", "delivered_at"
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

        await recalculateBalance(String(operation._id));

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

/**
 * @function getOperationServices
 * @description Returns all charge/payment records linked to an operation.
 */
export const getOperationServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const services = await OperationService.find({ operation_id: req.params.id }).sort({ date: 1, createdAt: 1 });
        res.status(200).json({ services });
    } catch (_error) {
        res.status(400).json({ message: "ID de operación inválido" });
    }
};

/**
 * @function createOperationService
 * @description Adds a new charge or payment record to an operation.
 */
export const createOperationService = async (req: Request, res: Response): Promise<void> => {
    try {
        const operation = await Operation.findById(req.params.id);
        if (!operation) {
            res.status(404).json({ message: "Operación no encontrada" });
            return;
        }

        const { concept, date, type, charge, payment } = req.body;

        if (!concept || !date || !type) {
            res.status(400).json({ message: "concept, date y type son requeridos" });
            return;
        }

        if (type === "D" && (charge == null || charge < 0)) {
            res.status(400).json({ message: "El campo charge es requerido para cargos" });
            return;
        }

        if (type === "P" && (payment == null || payment < 0)) {
            res.status(400).json({ message: "El campo payment es requerido para pagos" });
            return;
        }

        const service = await OperationService.create({
            operation_id: new Types.ObjectId(req.params.id as string),
            concept,
            date,
            type,
            charge: type === "D" ? charge : undefined,
            payment: type === "P" ? payment : undefined,
        });

        await recalculateBalance(String(req.params.id));

        res.status(201).json({ service });
    } catch (_error) {
        console.log(_error);
        res.status(400).json({ message: "Error al crear registro" });
    }
};

/**
 * @function updateOperationService
 * @description Updates concept, date, type and amount of an existing charge/payment record.
 */
export const updateOperationService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { concept, date, type, charge, payment } = req.body;

        const update: Record<string, unknown> = {};
        if (concept !== undefined) update.concept = concept;
        if (date !== undefined) update.date = date;
        if (type !== undefined) {
            update.type = type;
            if (type === "D") { update.charge = charge; update.payment = undefined; }
            if (type === "P") { update.payment = payment; update.charge = undefined; }
        }

        const service = await OperationService.findOneAndUpdate(
            { _id: req.params.serviceId, operation_id: req.params.id },
            update,
            { new: true, runValidators: true },
        );

        if (!service) {
            res.status(404).json({ message: "Registro no encontrado" });
            return;
        }

        await recalculateBalance(String(req.params.id));

        res.status(200).json({ service });
    } catch (_error) {
        res.status(400).json({ message: "Error al actualizar registro" });
    }
};

/**
 * @function deleteOperationService
 * @description Deletes a single charge/payment record from an operation.
 */
export const deleteOperationService = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await OperationService.findOneAndDelete({
            _id: req.params.serviceId,
            operation_id: req.params.id,
        });

        if (!service) {
            res.status(404).json({ message: "Registro no encontrado" });
            return;
        }

        await recalculateBalance(String(req.params.id));

        res.status(200).json({ message: "Registro eliminado correctamente" });
    } catch (_error) {
        res.status(400).json({ message: "ID inválido" });
    }
};
