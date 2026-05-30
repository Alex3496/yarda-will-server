import { Types } from "mongoose";
import Operation from "../../../models/operations.model";
import OperationService from "../../../models/operations_services.model";

export const title = "Recalcular saldos de operaciones";
export const description =
    "Recalcula el campo balance de todas las operaciones basándose en sus cargos y pagos registrados.";

export const seeder = async (): Promise<void> => {
    const operations = await Operation.find({}, { _id: 1 });

    let updated = 0;
    for (const op of operations) {
        const result = await OperationService.aggregate<{ totalCargos: number; totalPagos: number }>([
            { $match: { operation_id: new Types.ObjectId(String(op._id)) } },
            {
                $group: {
                    _id: null,
                    totalCargos: { $sum: { $cond: [{ $eq: ["$type", "D"] }, "$charge", 0] } },
                    totalPagos:  { $sum: { $cond: [{ $eq: ["$type", "P"] }, "$payment", 0] } },
                },
            },
        ]);
        const balance = result.length > 0 ? result[0].totalCargos - result[0].totalPagos : 0;
        await Operation.findByIdAndUpdate(op._id, { balance });
        updated++;
    }

    console.log(`Saldos recalculados para ${updated} operaciones.`);
};

export default { title, description, seeder };
