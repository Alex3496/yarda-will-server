import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { trackByBatch, setArrivalDate } from '../controllers/portal.controller';

const router = Router();

router.get('/tracking', authenticate, trackByBatch);
router.patch('/operations/:operationId/arrival-date', authenticate, setArrivalDate);

export default router;
