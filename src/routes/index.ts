import { Router } from 'express';
import authRouter from './auth.routes';
import clientsRouter from './clients.routes';
import userRouter from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/clients', clientsRouter);
router.use('/users', userRouter);

export default router;
