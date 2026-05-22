import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import {
    getNextKey,
    createService,
    getServices,
    getServiceById,
    updateService,
    deleteService,
} from "../controllers/services.controller";

const servicesRouter = Router();

servicesRouter.get("/next-key", [authenticate], getNextKey);
servicesRouter.post("/",        [authenticate], createService);
servicesRouter.get("/",         [authenticate], getServices);
servicesRouter.get("/:id",      [authenticate], getServiceById);
servicesRouter.patch("/:id",    [authenticate], updateService);
servicesRouter.delete("/:id",   [authenticate, requireAdmin], deleteService);

export default servicesRouter;
