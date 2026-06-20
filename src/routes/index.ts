import { Router } from 'express';
import authRouter from './auth.routes';
import clientsRouter from './clients.routes';
import userRouter from './user.routes';
import driversRouter from './drivers.routes';
import regionsRouter from './regions.routes';
import brandsRouter from './brands.routes';
import vehicleModelsRouter from './vehicleModels.routes';
import contactsRouter from './contacts.routes';
import auctionsRouter from './auctions.routes';
import operationsRouter from './operations.routes';
import servicesRouter from './services.routes';
import driverAssignmentsRouter from './driverAssignments.routes';
import imagesRouter from './images.routes';
import loanKeysRouter from './loanKeys.routes';
import publicRouter from './public.routes';
import portalRouter from './portal.routes';

const router = Router();

router.get('/health', (_req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'ok' });
});

router.use('/public', publicRouter);
router.use('/portal', portalRouter);
router.use('/auth', authRouter);
router.use('/clients', clientsRouter);
router.use('/users', userRouter);
router.use('/drivers', driversRouter);
router.use('/regions', regionsRouter);
router.use('/brands', brandsRouter);
router.use('/vehicle-models', vehicleModelsRouter);
router.use('/contacts', contactsRouter);
router.use('/auctions', auctionsRouter);
router.use('/operations', operationsRouter);
router.use('/services', servicesRouter);
router.use('/driver-assignments', driverAssignmentsRouter);
router.use('/images', imagesRouter);
router.use('/loan-keys', loanKeysRouter);

export default router;
