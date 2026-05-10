import { Router } from 'express';
import {
    createClient,
    deleteClient,
    getClientById,
    getClients,
    getNextKey,
    updateClient,
} from '../controllers/clients.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const clientsRouter = Router();

clientsRouter.get('/next-key',  [authenticate], getNextKey);
clientsRouter.post('/',         [authenticate], createClient);
clientsRouter.get('/',          [authenticate], getClients);
clientsRouter.get('/:id',       [authenticate], getClientById);
clientsRouter.patch('/:id',     [authenticate], updateClient);
clientsRouter.delete('/:id',    [authenticate, requireAdmin], deleteClient);

export default clientsRouter;
