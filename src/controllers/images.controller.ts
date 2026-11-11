import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import Operation from '../models/operations.model';
import { uploadsPath } from '../config/multer';

//Convierte la imagen a formato webp,
// con un ancho máximo de 1920px y calidad del 80% para optimizar el tamaño sin perder mucha calidad.
// .rotate() sin argumentos aplica la orientación EXIF: las fotos de celular vienen "acostadas"
// con una marca de rotación que se pierde al convertir a webp.
const compressImage = async (filePath: string): Promise<void> => {
  const buffer = await sharp(filePath)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await fs.promises.writeFile(filePath, buffer);
};

// Borra del disco los archivos recibidos (cuando la subida se rechaza o es un duplicado).
const removeFiles = (files: Express.Multer.File[]): void => {
  files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
};

// Id generado por el navegador para cada foto; permite reintentar sin duplicar.
const UPLOAD_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// Construye la URL completa para acceder a una imagen dada su ruta de archivo.
const buildImageUrl = (req: Request, filename: string): string =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

/**
 * @function uploadImage
 * Maneja la subida de imágenes para una operación específica. Valida que se hayan recibido archivos,
 * que la operación exista, comprime las imágenes, las guarda en el servidor, actualiza la base de datos
 * con las URLs de las imágenes y responde con la lista actualizada de imágenes de la operación.
 */
export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No se recibió ningún archivo.' });
      return;
    }

    const operationId = req.params.operationId;
    const rawUploadId = (req.body as { upload_id?: unknown } | undefined)?.upload_id;
    const uploadId = typeof rawUploadId === 'string' && UPLOAD_ID_PATTERN.test(rawUploadId)
      ? rawUploadId
      : undefined;

    const operation = await Operation.findById(operationId).select('images +image_upload_ids');
    if (!operation) {
      removeFiles(files);
      res.status(404).json({ message: 'Operación no encontrada.' });
      return;
    }

    // Retry of an upload that was already stored (the client never got the response): answer OK
    if (uploadId && operation.image_upload_ids?.includes(uploadId)) {
      removeFiles(files);
      res.status(200).json({ images: operation.images ?? [], duplicate: true });
      return;
    }

    // One at a time: compressing many large photos in parallel can exhaust the container's memory
    for (const f of files) {
      await compressImage(f.path);
    }

    const urls = files.map((f) => buildImageUrl(req, f.filename));

    // Conditional update so two simultaneous retries of the same upload_id cannot both be stored
    const filter: Record<string, unknown> = { _id: operationId };
    const update: Record<string, unknown> = { $push: { images: { $each: urls } } };
    if (uploadId) {
      filter.image_upload_ids = { $ne: uploadId };
      update.$addToSet = { image_upload_ids: uploadId };
    }

    const updated = await Operation.findOneAndUpdate(filter, update, { new: true });
    if (!updated) {
      // Lost the race against a parallel retry (or the operation was deleted meanwhile)
      removeFiles(files);
      const current = await Operation.findById(operationId).select('images');
      if (!current) {
        res.status(404).json({ message: 'Operación no encontrada.' });
        return;
      }
      res.status(200).json({ images: current.images ?? [], duplicate: true });
      return;
    }

    res.status(201).json({ images: updated.images });
  } catch (error) {
    if (files) removeFiles(files);
    console.error(error);
    res.status(500).json({ message: 'Error al subir imagen.' });
  }
};


/**
 * @function deleteImage
 * Maneja la eliminación de una imagen de una operación específica.
 * Valida que la operación y la imagen existan, elimina la URL de la imagen de la base de datos 
 * y borra el archivo del servidor.
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { operationId, filename } = req.params;

    const operation = await Operation.findById(operationId);
    if (!operation) {
      res.status(404).json({ message: 'Operación no encontrada.' });
      return;
    }

    const exists = operation.images?.some((url) => url.endsWith(`/${filename}`));
    if (!exists) {
      res.status(404).json({ message: 'Imagen no encontrada en esta operación.' });
      return;
    }

    operation.images = (operation.images ?? []).filter((url) => !url.endsWith(`/${filename}`));
    await operation.save();

    const filePath = path.join(uploadsPath, String(filename));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({ images: operation.images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar imagen.' });
  }
};
