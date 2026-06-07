// Trae Express para crear el servidor HTTP.
import express from 'express';
// Agrega cabeceras de seguridad al servidor.
import helmet from 'helmet';
// Permite que el frontend se comunique con este backend.
import cors from 'cors';
// Lee las cookies que llegan en las peticiones.
import cookieParser from 'cookie-parser';
// Sirve para trabajar con rutas y archivos del sistema.
import path from 'path';

// Importa todas las rutas de la API.
import routes from './routes';
// Obtiene la carpeta donde se guardan los archivos subidos.
import { uploadsPath } from './config/multer';
// Maneja los errores de forma centralizada.
import { errorHandler } from './middlewares/errorHandler';

// Crea la aplicación de Express.
const app = express();
console.log('CORS allowed origins:', process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173']);

// Añade protección básica con Helmet.
app.use(helmet({
  // Permite servir imágenes y archivos desde otro origen.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Habilita la lectura de cookies.
app.use(cookieParser());
// Configura CORS para aceptar peticiones del frontend.
app.use(cors({
  // Usa los orígenes definidos en la variable de entorno o el valor por defecto.
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  // Permite enviar cookies entre frontend y backend.
  credentials: true,
}));
// Permite recibir JSON en el cuerpo de las peticiones.
app.use(express.json({ limit: '10kb' }));
// Sirve los archivos subidos desde la ruta /uploads.
app.use('/uploads', express.static(path.resolve(uploadsPath)));
// Monta todas las rutas principales bajo /api.
app.use('/api', routes);
// Usa el manejador central de errores.
app.use(errorHandler);

// Exporta la app para usarla en index.ts.
export default app;
