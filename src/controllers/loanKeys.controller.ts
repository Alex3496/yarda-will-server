import { Request, Response } from "express";
import { Types } from "mongoose";
import LoanKey from "../models/loan_keys";
import Operation from "../models/operations.model";
import { TokenPayload } from "../utils/jwt";

/**
 * @function getOpenLoanKey
 * @description Returns the currently open (not yet returned) loan for an operation, or null.
 */
export const getOpenLoanKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const operationId = req.query.operation_id as string | undefined;
        if (!operationId) {
            res.status(400).json({ message: "operation_id es requerido" });
            return;
        }

        const loanKey = await LoanKey.findOne({ operation_id: operationId, returned_at: null })
            .populate("lent_user_id", "username")
            .populate("returned_user_id", "username");

        res.status(200).json({ loanKey });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener el préstamo de llaves" });
    }
};

/**
 * @function getLoanKeysByOperation
 * @description History of loans for an operation, newest first.
 */
export const getLoanKeysByOperation = async (req: Request, res: Response): Promise<void> => {
    try {
        const operationId = req.query.operation_id as string | undefined;
        if (!operationId) {
            res.status(400).json({ message: "operation_id es requerido" });
            return;
        }

        const loanKeys = await LoanKey.find({ operation_id: operationId })
            .sort({ createdAt: -1 })
            .populate("lent_user_id", "username")
            .populate("returned_user_id", "username");

        res.status(200).json({ loanKeys });
    } catch (_error) {
        res.status(500).json({ message: "Error al obtener el historial de préstamos" });
    }
};

/**
 * @function createLoanKey
 * @description Opens a new key loan for an operation. The folio is taken from the
 * operation key, and lent_user_id from the authenticated user. Rejects if the
 * operation already has an open loan.
 */
export const createLoanKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { operation_id, name, lent_at } = req.body as {
            operation_id?: string;
            name?: string;
            lent_at?: string;
        };

        if (!operation_id || !name || !lent_at) {
            res.status(400).json({ message: "operation_id, name y lent_at son requeridos" });
            return;
        }

        const operation = await Operation.findById(operation_id, { key: 1 });
        if (!operation) {
            res.status(404).json({ message: "Operación no encontrada" });
            return;
        }

        const existingOpen = await LoanKey.findOne({ operation_id, returned_at: null });
        if (existingOpen) {
            res.status(409).json({ message: "Ya existe un préstamo de llaves abierto para esta operación" });
            return;
        }

        const authUser = res.locals.authUser as TokenPayload;

        const loanKey = await LoanKey.create({
            folio: operation.key,
            operation_id,
            name,
            lent_at,
            lent_user_id: authUser.id,
            returned_at: null,
        });

        res.status(201).json({ loanKey });
    } catch (_error) {
        res.status(400).json({ message: "Error al registrar el préstamo de llaves" });
    }
};

/**
 * @function closeLoanKey
 * @description Closes an open loan by setting the return date and the user that
 * received the keys back. Rejects if the loan is already closed.
 */
export const closeLoanKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { returned_at } = req.body as { returned_at?: string };
        if (!returned_at) {
            res.status(400).json({ message: "returned_at es requerido" });
            return;
        }

        const loanKey = await LoanKey.findById(req.params.id);
        if (!loanKey) {
            res.status(404).json({ message: "Préstamo no encontrado" });
            return;
        }
        if (loanKey.returned_at) {
            res.status(409).json({ message: "Este préstamo ya fue cerrado" });
            return;
        }

        const authUser = res.locals.authUser as TokenPayload;
        loanKey.returned_at = new Date(returned_at);
        loanKey.returned_user_id = new Types.ObjectId(authUser.id);
        await loanKey.save();

        res.status(200).json({ loanKey });
    } catch (_error) {
        res.status(400).json({ message: "Error al cerrar el préstamo de llaves" });
    }
};

/**
 * @function deleteLoanKey
 * @description Deletes a loan record. Admin only — for fixing mistaken entries.
 */
export const deleteLoanKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const loanKey = await LoanKey.findByIdAndDelete(req.params.id);
        if (!loanKey) {
            res.status(404).json({ message: "Préstamo no encontrado" });
            return;
        }
        res.status(200).json({ message: "Préstamo eliminado correctamente" });
    } catch (_error) {
        res.status(400).json({ message: "ID de préstamo inválido" });
    }
};
