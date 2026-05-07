import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'ok' });
});

router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;
