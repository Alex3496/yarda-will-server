import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import {
    getNextKey,
    createOperation,
    getOperations,
    getOperationById,
    updateOperation,
    deleteOperation,
} from "../controllers/operations.controller";

const operationsRouter = Router();

operationsRouter.get("/next-key", [authenticate], getNextKey);
operationsRouter.post("/",        [authenticate], createOperation);
operationsRouter.get("/",         [authenticate], getOperations);
operationsRouter.get("/:id",      [authenticate], getOperationById);
operationsRouter.patch("/:id",    [authenticate], updateOperation);
operationsRouter.delete("/:id",   [authenticate, requireAdmin], deleteOperation);

export default operationsRouter;
