import { Router } from 'express';
//Componentes
import { upload } from '../config/multer';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadImages, deleteImage } from '../controllers/images.controller';

const router = Router();

// Orden de ejecucion de esta ruta:
// 1. authenticate verifica que el usuario haya iniciado sesion.
// 2. upload.single('image') busca el archivo en el campo "image",
//    lo valida con Multer y lo guarda en la carpeta.
// 3. uploadImage se ejecuta al final, cuando el archivo ya fue procesado,
//    para asociarlo a la operacion o responder al cliente.
// Acepta hasta 20 archivos en el campo "images" por request.
// Diseñado para soportar subida masiva desde móvil en el futuro.
router.post('/operations/:operationId', authenticate, upload.array('images', 20), uploadImages);

// En esta ruta no se sube un archivo nuevo; solo se valida el usuario
// y luego el controlador elimina la imagen indicada por su nombre.
router.delete('/operations/:operationId/:filename', authenticate, deleteImage);

export default router;
