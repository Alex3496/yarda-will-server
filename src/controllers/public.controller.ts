import type { Request, Response } from 'express';
import Operation from '../models/operations.model';
import OperationService from '../models/operations_services.model';


/**
 * @function trackByBatch
 * Metodo para rastrear una operación por su número de lote (batch). 
 * busca la operación correspondiente
 * y devuelve sus detalles junto con los servicios asociados.
 * Si no se encuentra la operación, devuelve un array vacío y total 0.
 * @param req 
 * @param res 
 * @returns 
 */
export const trackByBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = (req.query.batch as string)?.trim().toUpperCase();
    if (!batch) {
      res.status(400).json({ message: 'El parámetro batch es requerido.' });
      return;
    }

    const op = await Operation.findOne({ batch: new RegExp(`^${batch}$`, 'i') })
      .select(
        'key batch year color vin has_key buyer captured_at notes images brand_id model_id auction_id region_id arrival_date',
      )
      .populate('brand_id', 'name')
      .populate('model_id', 'name')
      .populate('auction_id', 'name')
      .populate('region_id', 'name')
      .lean();

    if (!op) {
      res.json({ operations: [], total: 0 });
      return;
    }

    const services = await OperationService.find({ operation_id: op._id })
      .select('concept date type charge payment')
      .sort({ date: 1 })
      .lean();

    const operation = {
      key: op.key,
      batch: op.batch,
      year: op.year,
      color: op.color ?? null,
      vin: op.vin ?? null,
      has_key: op.has_key ?? false,
      buyer: op.buyer ?? null,
      captured_at: op.captured_at ?? null,
      notes: op.notes ?? null,
      images: op.images ?? [],
      brand: (op.brand_id as { name?: string } | null)?.name ?? null,
      model: (op.model_id as { name?: string } | null)?.name ?? null,
      auction: (op.auction_id as { name?: string } | null)?.name ?? null,
      region: (op.region_id as { name?: string } | null)?.name ?? null,
      services: services.map((s) => ({
        concept: s.concept,
        type: s.type,
        date: s.date,
        amount: s.type === 'D' ? (s.charge ?? 0) : (s.payment ?? 0),
      })),
      arrival_date: op.arrival_date ?? null,
    };

    res.json({ operations: [operation], total: 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al consultar operaciones.' });
  }
};
