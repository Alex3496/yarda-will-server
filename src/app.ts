import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();
console.log('Initializing Express app with security and CORS settings...');
console.log('CORS allowed origins:', process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173']);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', routes);
app.use(errorHandler);

export default app;
