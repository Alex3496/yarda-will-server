import { Router } from 'express';
//Componentes
import { uploadImagesMiddleware } from '../config/multer';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadImages, deleteImage } from '../controllers/images.controller';

const router = Router();

// Orden de ejecucion de esta ruta:
// 1. authenticate verifica que el usuario haya iniciado sesion.
// 2. upload.single('image') busca el archivo en el campo "image",
//    lo valida con Multer y lo guarda en la carpeta.
// 3. uploadImage se ejecuta al final, cuando el archivo ya fue procesado,
//    para asociarlo a la operacion o responder al cliente.
// Acepta hasta 20 archivos en el campo "images" por request. El frontend sube una foto
// por request (más confiable con mala conexión) y manda un "upload_id" para evitar duplicados.
// uploadImagesMiddleware convierte los errores de Multer en respuestas 400/413 claras.
router.post('/operations/:operationId', authenticate, uploadImagesMiddleware, uploadImages);

// En esta ruta no se sube un archivo nuevo; solo se valida el usuario
// y luego el controlador elimina la imagen indicada por su nombre.
router.delete('/operations/:operationId/:filename', authenticate, deleteImage);

export default router;
