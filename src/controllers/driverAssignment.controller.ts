import { Request, Response } from "express";
import { Types } from "mongoose";
import DriverAssignment from "../models/driverAssignment.model";
import Operation from "../models/operations.model";
import Driver from "../models/driver.model";
import { generateAssignmentPDF } from "../resources/PDFs/AssignmentPDF";

export const createDriverAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { operation_ids, driver_id, assigned_at, levantamiento_date } = req.body;

        if (!Array.isArray(operation_ids) || operation_ids.length === 0 || !driver_id) {
            res.status(400).json({ message: "operation_ids y driver_id son requeridos" });
            return;
        }

        await Operation.updateMany(
            { _id: { $in: operation_ids } },
            {
                driver_id,
                driver_assigned_at: assigned_at ? new Date(assigned_at) : new Date(),
                levantamiento_date: levantamiento_date ? new Date(levantamiento_date) : null,
            },
        );

        const assignment = await DriverAssignment.create({
            operation_ids: operation_ids.map((id: string) => new Types.ObjectId(id)),
            driver_id: new Types.ObjectId(driver_id),
            assigned_at: assigned_at ? new Date(assigned_at) : new Date(),
            levantamiento_date: levantamiento_date ? new Date(levantamiento_date) : null,
            assigned_by: new Types.ObjectId(res.locals.authUser.id),
        });

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
        const assignments = await DriverAssignment.find({ operation_ids: operationId })
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
                .populate("operation_ids", "key batch")
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
        const { operation_ids, driver_id, assigned_at, levantamiento_date } = req.body;

        if (!Array.isArray(operation_ids) || operation_ids.length === 0 || !driver_id) {
            res.status(400).json({ message: "operation_ids y driver_id son requeridos" });
            return;
        }

        const [driver, operations] = await Promise.all([
            Driver.findById(driver_id).select("key name"),
            Operation.find({ _id: { $in: operation_ids } })
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
            operation_ids: operations as any,
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
                path: "operation_ids",
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

        const buffer = await generateAssignmentPDF(assignment as any);

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