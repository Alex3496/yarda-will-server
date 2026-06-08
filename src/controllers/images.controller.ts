import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import Operation from '../models/operations.model';
import { uploadsPath } from '../config/multer';

//Convierte la imagen a formato webp, 
// con un ancho máximo de 1920px y calidad del 80% para optimizar el tamaño sin perder mucha calidad.
const compressImage = async (filePath: string): Promise<void> => {
  const buffer = await sharp(filePath)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  fs.writeFileSync(filePath, buffer);
};

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

    const exists = await Operation.exists({ _id: req.params.operationId });
    if (!exists) {
      files.forEach((f) => fs.unlinkSync(f.path));
      res.status(404).json({ message: 'Operación no encontrada.' });
      return;
    }

    await Promise.all(files.map((f) => compressImage(f.path)));

    const urls = files.map((f) => buildImageUrl(req, f.filename));
    const updated = await Operation.findByIdAndUpdate(
      req.params.operationId,
      { $push: { images: { $each: urls } } },
      { new: true },
    );

    res.status(201).json({ images: updated!.images });
  } catch (error) {
    if (files) files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
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
