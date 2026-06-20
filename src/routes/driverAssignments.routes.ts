import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createDriverAssignment, listDriverAssignments, getPDFAsignment, previewPDFAsignment, getDriverReportPDF } from '../controllers/driverAssignment.controller';

const driverAssignmentsRouter = Router();

driverAssignmentsRouter.post('/', [authenticate], createDriverAssignment);
driverAssignmentsRouter.get('/',  [authenticate], listDriverAssignments);
driverAssignmentsRouter.post('/preview-pdf', [authenticate], previewPDFAsignment);
driverAssignmentsRouter.get('/report-pdf', [authenticate], getDriverReportPDF);
driverAssignmentsRouter.get('/:id/pdf', [authenticate], getPDFAsignment);

export default driverAssignmentsRouter;
