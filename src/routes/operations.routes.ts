import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import {
    getNextKey,
    createOperation,
    getOperations,
    getOperationById,
    updateOperation,
    deleteOperation,
    getOperationServices,
    createOperationService,
    updateOperationService,
    deleteOperationService,
} from "../controllers/operations.controller";
import { getDriverAssignments } from "../controllers/driverAssignment.controller";

const operationsRouter = Router();

operationsRouter.get("/next-key", [authenticate], getNextKey);
operationsRouter.post("/",        [authenticate], createOperation);
operationsRouter.get("/",         [authenticate], getOperations);
operationsRouter.get("/:id",      [authenticate], getOperationById);
operationsRouter.patch("/:id",    [authenticate], updateOperation);
operationsRouter.delete("/:id",   [authenticate, requireAdmin], deleteOperation);

operationsRouter.get("/:id/driver-assignments",          [authenticate], getDriverAssignments);
operationsRouter.get("/:id/services",                    [authenticate], getOperationServices);
operationsRouter.post("/:id/services",                   [authenticate], createOperationService);
operationsRouter.patch("/:id/services/:serviceId",       [authenticate], updateOperationService);
operationsRouter.delete("/:id/services/:serviceId",      [authenticate, requireAdmin], deleteOperationService);

export default operationsRouter;
