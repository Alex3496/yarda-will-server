import { Request, Response } from "express";
import { Types } from "mongoose";
import OperationService from "../models/operations_services.model";
import Operation from "../models/operations.model";
import Client from "../models/clients.model";
import {
    generateOperationServicesReportPDF,
    OperationServiceReportRow,
} from "../resources/PDFs/OperationServicesReportPDF";

// Populate de la operación referida con lo mínimo para mostrar/imprimir.
const OPERATION_POPULATE = {
    path: "operation_id",
    select: "key batch year brand_id model_id client_id",
    populate: [
        { path: "brand_id", select: "name" },
        { path: "model_id", select: "name" },
        { path: "client_id", select: "fullname" },
    ],
};

/** Normaliza el tipo recibido; por defecto "P" (pagos). */
const resolveType = (raw: unknown): "D" | "P" => (raw === "D" ? "D" : "P");

/**
 * Resuelve los `Operation._id` que cumplen los filtros de cliente y/o texto de
 * operación (clave o lote). Devuelve `null` cuando NO hay tales filtros (sin
 * restricción por operación).
 */
const resolveOperationIds = async (
    clientId?: string,
    operationText?: string,
): Promise<Types.ObjectId[] | null> => {
    const opFilter: Record<string, unknown> = {};
    let hasFilter = false;

    if (clientId && Types.ObjectId.isValid(clientId)) {
        opFilter.client_id = new Types.ObjectId(clientId);
        hasFilter = true;
    }
    if (operationText?.trim()) {
        const regex = new RegExp(operationText.trim(), "i");
        opFilter.$or = [{ key: regex }, { batch: regex }];
        hasFilter = true;
    }
    if (!hasFilter) return null;

    const ops = await Operation.find(opFilter).select("_id");
    return ops.map((o) => o._id as Types.ObjectId);
};

/**
 * Construye el filtro de Mongo compartido por el listado y el reporte.
 * Devuelve `null` cuando los filtros de cliente/operación no matchean ninguna
 * operación (resultado vacío garantizado).
 */
const buildFilter = async (req: Request): Promise<Record<string, unknown> | null> => {
    const filter: Record<string, unknown> = { type: resolveType(req.query.type) };

    const from = req.query.from ? new Date(req.query.from as string) : null;
    const to   = req.query.to   ? new Date(req.query.to   as string) : null;
    if (from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        filter.date = { $gte: from, $lte: to };
    }

    const search = req.query.search as string | undefined;
    if (search?.trim()) filter.concept = new RegExp(search.trim(), "i");

    const opIds = await resolveOperationIds(
        req.query.client_id as string,
        req.query.operation as string,
    );
    if (opIds !== null) {
        if (opIds.length === 0) return null;
        filter.operation_id = { $in: opIds };
    }

    return filter;
};

/**
 * @function listOperationServices
 * @description Listado global, paginado y filtrado de servicios registrados
 * (cargos/pagos). Por defecto devuelve los pagos (type=P).
 */
export const listOperationServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 25;
        const skip  = (page - 1) * limit;
        const type  = resolveType(req.query.type);
        const amountField = type === "D" ? "charge" : "payment";

        const filter = await buildFilter(req);
        if (filter === null) {
            res.status(200).json({ data: [], total: 0, page, limit, totalAmount: 0 });
            return;
        }

        const [data, total, totalAgg] = await Promise.all([
            OperationService.find(filter)
                .populate(OPERATION_POPULATE)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit),
            OperationService.countDocuments(filter),
            OperationService.aggregate([
                { $match: filter },
                { $group: { _id: null, sum: { $sum: `$${amountField}` } } },
            ]),
        ]);

        const totalAmount = totalAgg[0]?.sum ?? 0;
        res.status(200).json({ data, total, page, limit, totalAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener servicios registrados" });
    }
};

/**
 * @function operationServicesReportPDF
 * @description Genera el PDF del reporte de servicios registrados del tipo
 * activo (pagos o cargos), entre dos fechas (requeridas) y demás filtros.
 */
export const operationServicesReportPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const from = req.query.from ? new Date(req.query.from as string) : null;
        const to   = req.query.to   ? new Date(req.query.to   as string) : null;
        if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            res.status(400).json({ message: "Rango de fechas inválido" });
            return;
        }

        const type = resolveType(req.query.type);
        const filter = await buildFilter(req);

        let rows: OperationServiceReportRow[] = [];
        if (filter !== null) {
            const docs = await OperationService.find(filter)
                .populate(OPERATION_POPULATE)
                .sort({ date: 1, createdAt: 1 });
            rows = docs.map((d) => d.toObject()) as unknown as OperationServiceReportRow[];
        }

        if (rows.length === 0) {
            res.status(404).json({ message: "No hay registros en ese rango con los filtros aplicados" });
            return;
        }

        const total = rows.reduce(
            (acc, r) => acc + ((type === "D" ? r.charge : r.payment) ?? 0),
            0,
        );

        // Nombre del cliente filtrado (opcional), para el encabezado del reporte.
        let clientName: string | null = null;
        const clientId = req.query.client_id as string | undefined;
        if (clientId && Types.ObjectId.isValid(clientId)) {
            const client = await Client.findById(clientId).select("fullname");
            clientName = client?.fullname ?? null;
        }

        const conceptRaw = (req.query.search as string | undefined)?.trim();

        const fromDate = new Date(from); fromDate.setHours(0, 0, 0, 0);
        const toDate   = new Date(to);   toDate.setHours(23, 59, 59, 999);

        const buffer = await generateOperationServicesReportPDF({
            type,
            from: fromDate,
            to: toDate,
            clientName,
            concept: conceptRaw || null,
            rows,
            total,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="reporte-${type === "D" ? "cargos" : "pagos"}.pdf"`,
        );
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al generar reporte" });
    }
};
