import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Request } from 'express';


//Explicacion general: Este archivo configura Multer, una biblioteca de Node.js para manejar 
// la subida de archivos en aplicaciones Express. Define dónde se guardarán los archivos subidos, 
// cómo se nombrarán, qué tipos de archivos se permiten y exporta la configuración para usarla en las rutas de la API.

// Es practicamente un middleware que detecta un archivo en la peticion, lo valida y lo guarda en 
// una carpeta del servidor, para luego ser procesado por el controlador correspondiente. lo pasa a 
// la ruta de la API por el request 


// Multer necesita una carpeta física donde guardar los archivos subidos.
const uploadsPath = path.resolve(process.env.UPLOADS_PATH || './uploads');
// Crea la carpeta si no existe, para evitar errores al guardar imágenes.
fs.mkdirSync(uploadsPath, { recursive: true });

// Define cómo y dónde se guardarán los archivos en disco.
const storage = multer.diskStorage({
  // Indica la carpeta destino para cada archivo subido.
  destination: (_req, _file, cb) => cb(null, uploadsPath),
  // Genera un nombre único para evitar que dos archivos se pisen entre sí.
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// Filtra qué tipos de archivos se permiten subir.
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Lista de tipos MIME permitidos para imágenes.
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  // Si el archivo es una imagen permitida, se acepta.
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Si no es una imagen válida, se rechaza con un mensaje claro.
    cb(new Error('Solo se aceptan imágenes (jpeg, png, webp, jpg).'));
  }
};

// Crea la configuración final de Multer para usarla en las rutas.
export const upload = multer({
  // Usa el almacenamiento en disco definido arriba.
  storage,
  // Limita el tamaño máximo de cada archivo a 5 MB.
  limits: { fileSize: 5 * 1024 * 1024 },
  // Aplica el filtro de tipos de archivo.
  fileFilter,
});

// Exporta la ruta base donde se guardan los archivos subidos.
export { uploadsPath };
