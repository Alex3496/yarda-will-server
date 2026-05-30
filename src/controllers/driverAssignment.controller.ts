import { Request, Response } from "express";
import { Types } from "mongoose";
import DriverAssignment from "../models/driverAssignment.model";
import Operation from "../models/operations.model";

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
