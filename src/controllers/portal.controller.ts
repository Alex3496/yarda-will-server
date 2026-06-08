import type { Request, Response } from 'express';
import Operation from '../models/operations.model';
import OperationService from '../models/operations_services.model';


/**
 * @method setArrivalDate
 * @description Establece la fecha de llegada de una operación al ser llamada por primera vez desde el portal.
 */
export const setArrivalDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operationId } = req.params;

    let operation = await Operation.findById(operationId);
    if (!operation) {
      res.status(404).json({ message: 'Operación no encontrada.' });
      return;
    }
    if (operation.arrival_date) {
      res.status(200).json({ message: 'La fecha de llegada ya ha sido establecida.' });
      return;
    }

    operation.arrival_date = new Date();
    await operation.save();

    res.json({ message: 'Fecha de llegada actualizada correctamente.' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar fecha de llegada.' });
  }
};

/**
 * @method trackByBatch
 * @description Permite consultar el estado de una operación a través del número de lote desde el portal.
 * Devuelve la información de la operación junto con sus servicios relacionados.
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
        'key batch year color vin has_key buyer captured_at notes images brand_id model_id auction_id region_id',
      )
      .populate('brand_id', 'name')
      .populate('model_id', 'name')
      .populate('auction_id', 'name')
      .populate('region_id', 'name')
      .lean();

    if (!op) {
      res.json({ operation: null });
      return;
    }

    const services = await OperationService.find({ operation_id: op._id })
      .select('concept date type charge payment')
      .sort({ date: 1 })
      .lean();

    const operation = {
      _id: String(op._id),
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
    };

    res.json({ operation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al consultar operaciones.' });
  }
};
