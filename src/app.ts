import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();

app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

export default app;
