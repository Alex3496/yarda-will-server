import { Request, Response } from "express";
import { Types } from "mongoose";
import DriverAssignment from "../models/driverAssignment.model";
import Operation from "../models/operations.model";
import Driver from "../models/driver.model";
import OperationService from "../models/operations_services.model";
import { recalculateBalance } from "../services/operations.service";
import { generateAssignmentPDF } from "../resources/PDFs/AssignmentPDF";

interface OperationInput {
    operation_id: string;
    freight_cost: number;
}

const parseOperations = (raw: unknown): { operationIds: string[]; operationsData: { operation_id: Types.ObjectId; freight_cost: number }[] } => {
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error("operations es requerido y debe ser un arreglo no vacío");
    }

    const operationsData: { operation_id: Types.ObjectId; freight_cost: number }[] = [];
    const operationIds: string[] = [];

    for (const item of raw as OperationInput[]) {
        if (!item || typeof item !== "object") throw new Error("Elemento inválido en operations");

        const id = String(item.operation_id ?? "").trim();
        const cost = Number(item.freight_cost);

        if (!Types.ObjectId.isValid(id)) throw new Error(`operation_id inválido: ${id}`);
        if (!Number.isFinite(cost) || cost < 0) throw new Error(`freight_cost inválido para ${id}`);

        operationIds.push(id);
        operationsData.push({ operation_id: new Types.ObjectId(id), freight_cost: cost });
    }

    return { operationIds, operationsData };
};

export const createDriverAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { operations, driver_id, assigned_at, levantamiento_date } = req.body;

        if (!driver_id) {
            res.status(400).json({ message: "driver_id es requerido" });
            return;
        }

        let parsedOperations: ReturnType<typeof parseOperations>;
        try {
            parsedOperations = parseOperations(operations);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
            return;
        }

        const { operationIds, operationsData } = parsedOperations;
        const assignmentDate = assigned_at ? new Date(assigned_at) : new Date();
        const levantamientoDate = levantamiento_date ? new Date(levantamiento_date) : null;

        await Operation.updateMany(
            { _id: { $in: operationIds } },
            {
                driver_id,
                driver_assigned_at: assignmentDate,
                levantamiento_date: levantamientoDate,
            },
        );

        const assignment = await DriverAssignment.create({
            operations: operationsData,
            driver_id: new Types.ObjectId(driver_id),
            assigned_at: assignmentDate,
            levantamiento_date: levantamientoDate,
            assigned_by: new Types.ObjectId(res.locals.authUser.id),
        });

        const freightCharges = operationsData
            .filter((item) => item.freight_cost > 0)
            .map((item) => ({
                operation_id: item.operation_id,
                assignment_id: assignment._id,
                concept: `FLETE ASIGNACION ${assignment.key}`,
                date: assignmentDate,
                type: "D" as const,
                charge: item.freight_cost,
            }));

        if (freightCharges.length > 0) {
            await OperationService.insertMany(freightCharges);
            await Promise.all(
                freightCharges.map((charge) => recalculateBalance(String(charge.operation_id))),
            );
        }

        res.status(201).json({ assignment });
    } catch (_error) {
        console.error(_error);
        res.status(400).json({ message: "Error al crear asignación" });
    }
};

export const getDriverAssignments = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const operationIdParam = req.params.id;
        if (!Types.ObjectId.isValid(operationIdParam)) {
            res.status(400).json({ message: "ID de operación inválido" });
            return;
        }

        const operationId = new Types.ObjectId(operationIdParam);
        const assignments = await DriverAssignment.find({ "operations.operation_id": operationId })
            .populate("driver_id", "key name")
            .populate("assigned_by", "email")
            .sort({ createdAt: 1 });

        res.status(200).json({ assignments });
    } catch (_error) {
        res.status(400).json({ message: "ID de operación inválido" });
    }
};

export const listDriverAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip  = (page - 1) * limit;

        const [data, total] = await Promise.all([
            DriverAssignment.find()
                .populate("operations.operation_id", "key batch")
                .populate("driver_id", "key name")
                .populate("assigned_by", "email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            DriverAssignment.countDocuments(),
        ]);

        res.status(200).json({ data, total, page });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener historial de asignaciones" });
    }
};

export const previewPDFAsignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { operations, driver_id, assigned_at, levantamiento_date } = req.body;

        if (!driver_id) {
            res.status(400).json({ message: "driver_id es requerido" });
            return;
        }

        let parsedOperations: ReturnType<typeof parseOperations>;
        try {
            parsedOperations = parseOperations(operations);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
            return;
        }

        const { operationIds, operationsData } = parsedOperations;
        const freightMap = new Map(operationsData.map((item) => [String(item.operation_id), item.freight_cost]));

        const [driver, dbOperations] = await Promise.all([
            Driver.findById(driver_id).select("key name"),
            Operation.find({ _id: { $in: operationIds } })
                .select("key batch year color vin expiration_date brand_id model_id region_id auction_id")
                .populate("brand_id", "name")
                .populate("model_id", "name")
                .populate("region_id", "name")
                .populate("auction_id", "name"),
        ]);

        if (!driver) {
            res.status(404).json({ message: "Chofer no encontrado" });
            return;
        }

        const buffer = await generateAssignmentPDF({
            key: "BORRADOR",
            driver_id: driver as any,
            assigned_at: assigned_at ? new Date(assigned_at) : new Date(),
            levantamiento_date: levantamiento_date ? new Date(levantamiento_date) : null,
            operations: dbOperations.map((op) => ({
                ...(op.toObject() as unknown as Record<string, unknown>),
                freight_cost: freightMap.get(String(op._id)) ?? 0,
            })) as any,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="preview-asignacion.pdf"`);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al generar previsualización" });
    }
};

export const getPDFAsignment = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const assignmentId = req.params.id;
        if (!Types.ObjectId.isValid(assignmentId)) {
            res.status(400).json({ message: "ID de asignación inválido" });
            return;
        }

        const assignment = await DriverAssignment.findById(assignmentId)
            .populate<{ driver_id: { key: string; name: string } }>("driver_id", "key name")
            .populate({
                path: "operations.operation_id",
                select: "key batch year color vin expiration_date brand_id model_id region_id auction_id",
                populate: [
                    { path: "brand_id", select: "name" },
                    { path: "model_id", select: "name" },
                    { path: "region_id", select: "name" },
                    { path: "auction_id", select: "name" },
                ],
            });

        if (!assignment) {
            res.status(404).json({ message: "Asignación no encontrada" });
            return;
        }

        const operationRows = assignment.operations.map((item) => ({
            ...(typeof (item.operation_id as unknown as { toObject?: () => Record<string, unknown> }).toObject === "function"
                ? ((item.operation_id as unknown as { toObject: () => Record<string, unknown> }).toObject())
                : (item.operation_id as unknown as Record<string, unknown>)),
            freight_cost: item.freight_cost,
        }));

        const buffer = await generateAssignmentPDF({
            key: assignment.key,
            driver_id: assignment.driver_id as any,
            assigned_at: assignment.assigned_at,
            levantamiento_date: assignment.levantamiento_date,
            operations: operationRows as any,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="asignacion-${assignment.key}.pdf"`,
        );
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al generar PDF" });
    }
}