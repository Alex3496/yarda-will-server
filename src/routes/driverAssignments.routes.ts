import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createDriverAssignment, listDriverAssignments } from '../controllers/driverAssignment.controller';

const driverAssignmentsRouter = Router();

driverAssignmentsRouter.post('/', [authenticate], createDriverAssignment);
driverAssignmentsRouter.get('/',  [authenticate], listDriverAssignments);

export default driverAssignmentsRouter;
