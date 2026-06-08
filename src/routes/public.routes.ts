import { Router } from 'express';
import { trackByBatch } from '../controllers/public.controller';

const router = Router();

router.get('/tracking', trackByBatch);

export default router;
