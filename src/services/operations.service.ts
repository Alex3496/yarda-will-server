import { Types } from "mongoose";
import Decimal from "decimal.js";
import Operation from "../models/operations.model";
import OperationService from "../models/operations_services.model";

/**
 * @description recalculate the balance of an operation by summing its cargos and pagos. 
 * If there are no services, set cost to 0 and balance to null.
 * @param operationId 
 * @returns 
 */
export const recalculateBalance = async (operationId: string): Promise<void> => {
    const services = await OperationService.find({ operation_id: new Types.ObjectId(operationId) });

    if (services.length === 0) {
        await Operation.findByIdAndUpdate(operationId, { cost: 0, balance: null });
        return;
    }

    let totalCargos = new Decimal(0);
    let totalPagos  = new Decimal(0);
    for (const s of services) {
        if (s.type === "D") totalCargos = totalCargos.plus(s.charge ?? 0);
        if (s.type === "P") totalPagos  = totalPagos.plus(s.payment ?? 0);
    }

    await Operation.findByIdAndUpdate(operationId, {
        cost:    totalCargos.toNumber(),
        balance: totalCargos.minus(totalPagos).toNumber(),
    });
};
